import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag, Share2, Globe } from "lucide-react";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";
import PressReleaseCta from "./PressReleaseCta";
import FallbackImage from "./FallbackImage";

const STANDARD_FOOTER = `
<div style='margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e5e7eb;'>
  <h4 style='text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:0.5rem;'>Media Contact</h4>
  <p style='margin:0;font-weight:700;color:#111827;'>Drop PR AI Research &amp; Media Desk</p>
  <p style='margin:2px 0;color:#4b5563;'>support@droppr.ai</p>
  <p style='margin:2px 0;color:#4b5563;'>Austin, Texas</p>
</div>
<div style='margin-top:1.25rem;padding:1rem;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;'>
  <h4 style='margin-top:0;color:#111827;font-size:1rem;margin-bottom:0.5rem;'>About Drop PR</h4>
  <p style='margin-bottom:0.75rem;color:#374151;line-height:1.6;font-size:0.875rem;'><a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a> transforms creator videos, podcasts, product reviews, and brand announcements into professionally written editorial-style articles distributed across a broad network of digital publishers. The platform helps brands, creators, agencies, and e-commerce companies expand search visibility, strengthen AI discoverability, generate backlinks, and extend the lifespan of short-form content beyond social media feeds.</p>
  <h4 style='margin-top:1rem;color:#111827;font-size:1rem;margin-bottom:0.5rem;'>Call to Action</h4>
  <p style='margin-bottom:0;color:#374151;line-height:1.6;font-size:0.875rem;'>Brands, creators, podcasters, and agencies interested in turning content into distributed editorial coverage can learn more at <a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a>.</p>
</div>
`;

function stripFooter(html) {
    if (!html) return "";
    const footerKeywords = [
        "<div style='margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;'>",
        "<div style=\"margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;\">",
        "<div style='margin-top:3rem;",
        "<div style=\"margin-top:3rem;",
        "<h4>Media Contact</h4>",
        "<h4 style='text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;'>Media Contact</h4>",
        "<h4 style=\"text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;\">Media Contact</h4>",
        "Media Contact",
        "<div style='margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e5e7eb;'>",
        "<div style=\"margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e5e7eb;\">",
    ];

    for (const keyword of footerKeywords) {
        const index = html.indexOf(keyword);
        if (index !== -1) {
            let cleanHtml = html.substring(0, index).trim();
            if (cleanHtml.endsWith("<div>")) {
                cleanHtml = cleanHtml.slice(0, -5).trim();
            }
            return cleanHtml;
        }
    }

    return html;
}

async function getArticle(id) {
    const isLocalId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isLocalId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${baseUrl}/public/press-releases/${id}`, {
                next: { revalidate: 300 }
            });
            if (!res.ok) return null;
            const data = await res.json();

            const campaign = data.data;
            if (!campaign) return null;

            return {
                id: campaign._id,
                title: campaign.article?.headline,
                description: campaign.article?.summary,
                body: campaign.article?.body,
                introduction: campaign.article?.introduction,
                image: campaign.productCard?.thumbnail,
                author: campaign.productCard?.authorName || campaign.userId?.name,
                published: campaign.createdAt,
                category: [campaign.article?.productSummary?.category || "Platform"],
                isPlatform: true,
                campaign: campaign
            };
        } catch (error) {
            console.error("Platform Detail Fetch Error:", error);
            return null;
        }
    }

    const API_KEY = process.env.CURRENTS_API_KEY || "dXND77Am6Zv7gvZe37eGWWZEmDJwHIXNzAefrIvpqlg7vxqw";
    const url = `https://api.currentsapi.services/v1/search?apiKey=${API_KEY}&keywords=press%20release%20AI&country=us&language=en&category=technology&page_size=100`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 3600 }
        });
        const data = await res.json();
        const article = data.news?.find(a => a.id === id) || null;
        if (article) article.isPlatform = false;
        return article;
    } catch (error) {
        console.error("Fetch Article Error:", error);
        return null;
    }
}

async function getRelatedPressReleases(id) {
    const isLocalId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isLocalId) return [];

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
        const res = await fetch(`${baseUrl}/public/press-releases/${id}/related?limit=3`, {
            next: { revalidate: 300 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("Related Press Releases Fetch Error:", error);
        return [];
    }
}

export default async function ArticleDetailsPage({ params }) {
    const { id } = await params;
    const [article, relatedCampaigns] = await Promise.all([
        getArticle(id),
        getRelatedPressReleases(id)
    ]);

    if (!article) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-32 text-center">
                    <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
                    <p className="text-gray-600 mb-8">The article you are looking for might have been moved or is no longer available.</p>
                    <Link href="/press-releases" className="text-brand-blue font-bold flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> Back to Newsroom
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const displayProduct = article.campaign?.productCard || {};
    const displayData = article.campaign?.article || {};
    const authorInitials = (article.author || "Drop PR Author")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className="min-h-screen flex flex-col selection:bg-primary/10"
            style={{ background: "#fafaf7" }}
        >
            <Header />

            <main className="pt-10 pb-20">
                <article className="relative">
                    {/* Breadcrumbs & Header section wrapper */}
                    <div className="max-w-3xl mx-auto px-6 mt-4">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/press-releases" className="hover:text-primary transition-colors">Newsroom</Link>
                            <span>/</span>
                            <span className="text-gray-900 truncate max-w-[200px] md:max-w-md">{article.title}</span>
                        </nav>

                        {/* Title - styled exactly like blog detail */}
                        <h1
                            className="text-3xl md:text-[46px] leading-tight md:leading-[1.08]"
                            style={{
                                fontFamily: "var(--font-serif, Georgia, serif)",
                                fontWeight: 700,
                                letterSpacing: "-0.025em",
                                marginBottom: "20px",
                                color: "#0a0e1a",
                            }}
                        >
                            {article.title}
                        </h1>

                        {/* Summary / Description (Lead style under title) */}
                        {article.description && (
                            <div
                                className="text-lg md:text-[22px] leading-normal md:leading-[1.45]"
                                style={{
                                    color: "#5f5f5f",
                                    fontStyle: "italic",
                                    marginBottom: "32px",
                                    fontFamily: "Charter, Georgia, serif",
                                }}
                            >
                                {article.description}
                            </div>
                        )}

                        <hr className="border-gray-200 mb-6" />

                        {/* Author/Meta Row */}
                        <div className="flex items-center gap-4 mb-6">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <span className="text-white text-xs font-black">
                                    {authorInitials}
                                </span>
                            </div>
                            {/* Meta info */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                        Published by : {article.author || "Drop PR Author"}
                                    </p>
                                    <span className="text-xs text-gray-300">·</span>
                                    <span className="text-xs text-gray-500">
                                        Published {article.published ? new Date(article.published).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "Recently"}
                                    </span>
                                    {article.isPlatform && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-bold tracking-tight ml-2">
                                            Drop PR Verified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-0 mt-1.5">
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                        {article.category?.[0] || "General"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200 mb-8" />
                    </div>

                    {/* Main article content - styled like blog detail page */}
                    <div className="max-w-3xl mx-auto px-6">
                        {/* Featured Product Block */}
                        {article.isPlatform && displayProduct.productName && (
                            <div className="bg-[#f2f2ee] rounded-2xl p-4 md:p-6 border border-gray-200/50 mb-8">
                                <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                    Featured Product
                                </span>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 text-center sm:text-left">
                                    {displayProduct.thumbnail && (
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                                            <img
                                                src={displayProduct.thumbnail}
                                                alt="Product"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h4 className="text-lg md:text-xl font-bold text-gray-900">
                                            {displayProduct.productName}
                                        </h4>
                                        <div className="space-y-1.5 mt-2">
                                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                                {(displayData.categories || displayData.productSummary?.category)?.split(",").map(c => c.trim()).filter(c => c).map((cat, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-full border border-blue-100">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-1 mt-2">
                                                {displayData.productSummary?.useCase && (
                                                    <div><span className="font-bold opacity-60">Use case:</span> {displayData.productSummary.useCase}</div>
                                                )}
                                                {displayData.productSummary?.positioning && (
                                                    <div><span className="font-bold opacity-60">Positioning:</span> {displayData.productSummary.positioning}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Styled HTML Body */}
                        <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />
                        <div className="blog-content space-y-6 text-gray-800">
                            {article.isPlatform ? (
                                <>
                                    {article.body && /\<[a-z][\s\S]*\>/i.test(article.body) ? (
                                        <div
                                            className="html-content-preview article-html"
                                            dangerouslySetInnerHTML={{ __html: `<div>${stripFooter(article.body)}</div>` }}
                                        />
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {stripFooter(article.body)}
                                        </div>
                                    )}
                                    {article.campaign?.article?.conclusion && (
                                        <div className="mt-8 font-medium italic text-gray-700">
                                            {article.campaign.article.conclusion}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4 leading-relaxed">
                                    <p>
                                        Artificial Intelligence continues to reshape the landscape of modern business and technology distribution. This latest announcement highlights the accelerating pace of innovation in the US market, particularly within the technology and media sectors.
                                    </p>
                                    <p>
                                        As brands increasingly turn to automated solutions for content generation and media distribution, the role of professional press release services like DropPR.ai becomes even more critical in ensuring quality and authenticity.
                                    </p>
                                    <p>
                                        For more detailed information regarding this breakthrough and its implications for your industry, we recommend viewing the full announcement on the original publication platform.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Creator Quote */}
                        {article.campaign?.article?.creatorQuote && (
                            <div className="py-6 md:py-8 my-8 border-y border-gray-200/60 flex flex-col items-center gap-2">
                                <div className="italic text-base md:text-xl text-gray-800 text-center leading-relaxed font-serif">
                                    &ldquo;{article.campaign.article.creatorQuote}&rdquo;
                                </div>
                                {displayProduct.authorName && (
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        From {displayProduct.authorName}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Purchase Information */}
                        {article.isPlatform && displayProduct.affiliateLink && (
                            <div className="space-y-3 mt-10">
                                <h4 className="text-lg md:text-xl font-bold text-gray-900">
                                    Purchase Information
                                </h4>
                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                    If you&apos;ve seen the video and wondered whether{" "}
                                    {displayProduct?.productName || "it"} could fit into your own routine,
                                    product details, pricing, and availability are available through
                                    the official product page.
                                </p>
                                <div className="pt-2 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Product Page:
                                    </p>
                                    <a
                                        href={displayProduct.affiliateLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-blue-700 underline font-semibold text-sm transition-colors flex items-center gap-1.5 w-fit"
                                    >
                                        Click here to see product
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Source Video / External Link */}
                        <div className="pt-6 mt-8 border-t border-gray-200/60 text-xs text-gray-500 flex flex-col gap-3">
                            {!article.isPlatform && article.url && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Original Source:
                                    </p>
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 underline font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        View Original Article
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                            {article.isPlatform && article.campaign?.videoSource !== "document_upload" && displayProduct.sourceVideoLink && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Original Source:
                                    </p>
                                    <a
                                        href={displayProduct.sourceVideoLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 underline font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        Watch Original Creator Video
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                            {article.isPlatform && article.campaign?.videoSource === "document_upload" && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 w-fit">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Article Generated from Document</span>
                                </div>
                            )}
                            <p className="mt-2 text-[11px] opacity-80">
                                {(displayProduct.authorName || article.author) &&
                                    `© ${new Date().getFullYear()} ${displayProduct.authorName || article.author}`}
                            </p>
                        </div>
                    </div>
                </article>

                {/* ─── Related Press Releases ─── */}
                {relatedCampaigns.length > 0 && (
                    <section
                        className="mt-16 md:mt-20 border-t border-gray-200/60"
                        style={{ background: "#fafaf7" }}
                    >
                        <div className="max-w-6xl mx-auto px-6 py-12">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 text-center">
                                Related Press Releases
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedCampaigns.map((rc) => {
                                    const rcTitle = rc.article?.headline || "Untitled";
                                    const rcSummary = rc.article?.summary || "";
                                    const rcImage = rc.productCard?.thumbnail || "/fallback-platform.jpeg";
                                    const rcAuthor = rc.productCard?.authorName || rc.userId?.name || "Drop PR Author";
                                    const rcDate = rc.createdAt;
                                    const rcInitials = rcAuthor.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

                                    return (
                                        <Link
                                            key={rc._id}
                                            href={`/press-releases/${rc._id}`}
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                                        >
                                            {/* Card Image */}
                                            <div className="relative h-44 overflow-hidden bg-gray-100">
                                                <FallbackImage
                                                    src={rcImage}
                                                    fallbackSrc="/fallback-platform.jpeg"
                                                    alt={rcTitle}
                                                    className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-primary text-white text-[9px] font-bold px-2.5 py-1 rounded-full tracking-widest shadow-md">
                                                        Drop PR
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-4 flex-grow flex flex-col">
                                                {/* Tags */}
                                                {rc.article?.productSummary?.category && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {rc.article.productSummary.category.split(",").map(c => c.trim()).filter(c => c).slice(0, 2).map((cat, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-primary text-[9px] font-bold rounded-full border border-blue-100">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                                                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                                                        <span className="text-white text-[7px] font-black">{rcInitials}</span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-600 font-medium">
                                                        {rcAuthor}
                                                    </span>
                                                </div>

                                                {/* Meta */}
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {rcDate ? new Date(rcDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3
                                                    className="line-clamp-2 group-hover:text-primary transition-colors mb-2"
                                                    style={{
                                                        fontFamily: "var(--font-serif, Georgia, serif)",
                                                        fontSize: "15px",
                                                        fontWeight: 700,
                                                        lineHeight: 1.35,
                                                        letterSpacing: "-0.01em",
                                                        color: "#0a0e1a",
                                                    }}
                                                >
                                                    {rcTitle}
                                                </h3>

                                                {/* Excerpt */}
                                                {rcSummary && (
                                                    <div className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                                        {rcSummary}
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                        Read Press Release
                                                        <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ─── "Want to see your brand here?" CTA Card ─── */}
                <PressReleaseCta />

                {/* Back Link */}
                <div className="mt-12 text-center">
                    <Link
                        href="/press-releases"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to all press releases
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function ArrowRightIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
