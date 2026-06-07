"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import LoginModal from "@/components/landingPage/LoginModal";
import userAuthStore from "@/store/userAuthStore";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripFooter(html) {
    if (!html) return "";
    const markers = ["Media Contact", "<h4>Media Contact</h4>", "<div style='margin-top:3rem;"];
    for (const m of markers) {
        const idx = html.indexOf(m);
        if (idx !== -1) return html.substring(0, idx).trim();
    }
    return html;
}

function initials(name = "Drop PR") {
    return name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
}

// ─── Sub-components (no hooks — safe to keep inline) ─────────────────────────

function ArrowRight({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}>
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
    );
}

function Img({ src, fallback, alt, className }) {
    const good = src && src !== "None" && src !== "";
    const [cur, setCur] = useState(good ? src : fallback);
    useEffect(() => { setCur(good ? src : fallback); }, [src, fallback]);
    return (
        <img src={cur} alt={alt} className={className}
            onError={(e) => { e.target.onerror = null; setCur(fallback); }} />
    );
}

// ─── CTA section (no hooks — safe inline) ────────────────────────────────────

function CtaSection({ onGetStarted }) {
    return (
        <section className="max-w-4xl mx-auto mt-8 px-6">
            <div className="bg-linear-to-r from-brand-dark to-brand-blue rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <h2 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-6 relative z-10">
                    Want to see your brand here?
                </h2>
                <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto relative z-10">
                    Use DropPR.ai to turn your content into professional press releases and distribute them across our global media network.
                </p>
                <button
                    onClick={onGetStarted}
                    className="inline-flex items-center gap-2 px-8 md:px-10 py-3 md:py-4 bg-white text-brand-dark font-bold rounded-xl hover:shadow-xl transition-all scale-100 hover:scale-105 relative z-10 cursor-pointer"
                >
                    Start Publishing Now
                    <ArrowRight className="w-5 h-4" />
                </button>
            </div>
        </section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PressReleaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const { isAuthenticated } = userAuthStore();

    const [article, setArticle] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    // Fetch main article
    useEffect(() => {
        if (!id) return;

        // Non-MongoDB ID → show not found immediately
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            setLoading(false);
            return;
        }

        let alive = true;
        setLoading(true);

        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/public/press-releases/${id}`);
                if (res.ok) {
                    const json = await res.json();
                    if (alive && json?.success && json?.data) {
                        const c = json.data;
                        // article found — populate state
                        setArticle({
                            id: c._id,
                            title: c.article?.headline || "",
                            summary: c.article?.summary || "",
                            body: c.article?.body || "",
                            conclusion: c.article?.conclusion || "",
                            creatorQuote: c.article?.creatorQuote || "",
                            introduction: c.article?.introduction || "",
                            category: c.article?.productSummary?.category || "",
                            useCase: c.article?.productSummary?.useCase || "",
                            positioning: c.article?.productSummary?.positioning || "",
                            image: c.productCard?.thumbnail || "",
                            productName: c.productCard?.productName || "",
                            authorName: c.productCard?.authorName || c.userId?.name || "Drop PR Author",
                            affiliateLink: c.productCard?.affiliateLink || "",
                            sourceVideoLink: c.productCard?.sourceVideoLink || "",
                            videoSource: c.videoSource || "",
                            published: c.createdAt || "",
                        });
                    }
                }
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [id, router]);

    // Fetch related
    useEffect(() => {
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return;

        let alive = true;
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/public/press-releases/${id}/related?limit=3`);
                if (res.ok) {
                    const json = await res.json();
                    if (alive && json?.success) setRelated(json.data || []);
                }
            } catch (e) {
                console.error("Related fetch error:", e);
            }
        })();

        return () => { alive = false; };
    }, [id]);

    // ─── CTA handler ──────────────────────────────────────────────────────────
    function handleGetStarted() {
        if (isAuthenticated) {
            router.push("/user/dashboard/create");
        } else {
            setShowLogin(true);
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-3 py-32">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading press release…</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex items-center justify-center py-32 px-6">
                <div className="text-center max-w-md">
                    <div className="text-7xl font-black text-gray-100 select-none mb-2">404</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Press Release Not Found</h1>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        The press release you&apos;re looking for doesn&apos;t exist or may have been removed.
                    </p>
                    <Link
                        href="/press-releases"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Newsroom
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: "#fafaf7" }}>
            <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />

            <div className="pt-6 pb-20">
                <article className="max-w-3xl mx-auto px-6">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/press-releases" className="hover:text-primary transition-colors">Newsroom</Link>
                        <span>/</span>
                        <span className="text-gray-900 truncate max-w-[200px] md:max-w-md">{article.title}</span>
                    </nav>

                    {/* Title */}
                    <h1
                        className="text-3xl md:text-[46px] leading-tight md:leading-[1.08]"
                        style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "20px", color: "#0a0e1a" }}
                    >
                        {article.title}
                    </h1>

                    {/* Summary */}
                    {article.summary && (
                        <div
                            className="text-lg md:text-[22px] leading-normal md:leading-[1.45]"
                            style={{ color: "#5f5f5f", fontStyle: "italic", marginBottom: "32px", fontFamily: "Charter, Georgia, serif" }}
                        >
                            {article.summary}
                        </div>
                    )}

                    <hr className="border-gray-200 mb-6" />

                    {/* Author row */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-black">{initials(article.authorName)}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Published by: {article.authorName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                    {article.published
                                        ? new Date(article.published).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
                                        : "Recently"}
                                </span>
                                {article.category && (
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{article.category}</span>
                                )}
                                <span className="inline-flex items-center text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-bold tracking-tight">
                                    Drop PR Verified
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 mb-8" />

                    {/* Featured product block */}
                    {article.productName && (
                        <div className="bg-[#f2f2ee] rounded-2xl p-4 md:p-6 border border-gray-200/50 mb-8">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Featured Product</span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                {article.image && (
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                                        <Img src={article.image} fallback="/fallback-platform.jpeg" alt="Product" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-gray-900">{article.productName}</h4>
                                    {article.category && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-full border border-blue-100 inline-block">
                                            {article.category}
                                        </span>
                                    )}
                                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                                        {article.useCase && <div><span className="font-bold opacity-60">Use case:</span> {article.useCase}</div>}
                                        {article.positioning && <div><span className="font-bold opacity-60">Positioning:</span> {article.positioning}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div className="blog-content space-y-6 text-gray-800">
                        {article.body && /<[a-z][\s\S]*>/i.test(article.body) ? (
                            <div className="html-content-preview article-html"
                                dangerouslySetInnerHTML={{ __html: `<div>${stripFooter(article.body)}</div>` }} />
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">{stripFooter(article.body)}</div>
                        )}
                        {article.conclusion && (
                            <div className="mt-8 font-medium italic text-gray-700">{article.conclusion}</div>
                        )}
                    </div>

                    {/* Creator quote */}
                    {article.creatorQuote && (
                        <div className="py-6 my-8 border-y border-gray-200/60 text-center">
                            <p className="italic text-base md:text-xl text-gray-800 font-serif">&ldquo;{article.creatorQuote}&rdquo;</p>
                            {article.authorName && (
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">From {article.authorName}</p>
                            )}
                        </div>
                    )}

                    {/* Purchase info */}
                    {article.videoSource !== "document_upload" && article.affiliateLink && (
                        <div className="space-y-3 mt-10">
                            <h4 className="text-lg font-bold text-gray-900">Purchase Information</h4>
                            <a href={article.affiliateLink} target="_blank" rel="noopener noreferrer"
                                className="text-primary underline font-semibold text-sm flex items-center gap-1.5 w-fit">
                                Click here to see product
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    )}

                    {/* Source / footer */}
                    <div className="pt-6 mt-8 border-t border-gray-200/60 text-xs text-gray-500 flex flex-col gap-3">
                        {article.videoSource !== "document_upload" && article.sourceVideoLink && (
                            <a href={article.sourceVideoLink} target="_blank" rel="noopener noreferrer"
                                className="text-blue-500 underline font-medium flex items-center gap-1.5">
                                Watch Original Creator Video
                            </a>
                        )}
                        {article.videoSource === "document_upload" && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 w-fit uppercase tracking-tight">
                                Article Generated from Document
                            </span>
                        )}
                        <p className="text-[11px] opacity-80">
                            © {new Date().getFullYear()} {article.authorName}
                        </p>
                    </div>
                </article>

                {/* Related */}
                {related.length > 0 && (
                    <section className="mt-16 border-t border-gray-200/60" style={{ background: "#fafaf7" }}>
                        <div className="max-w-6xl mx-auto px-6 py-12">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 text-center">Related Press Releases</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {related.map((rc) => {
                                    const rcTitle = rc.article?.headline || "Untitled";
                                    const rcSummary = rc.article?.summary || "";
                                    const rcImg = rc.productCard?.thumbnail || "/fallback-platform.jpeg";
                                    const rcAuthor = rc.productCard?.authorName || rc.userId?.name || "Drop PR Author";
                                    const rcDate = rc.createdAt;
                                    return (
                                        <Link key={rc._id} href={`/press-releases/${rc._id}`}
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                                            <div className="relative h-44 overflow-hidden bg-gray-100">
                                                <Img src={rcImg} fallback="/fallback-platform.jpeg" alt={rcTitle}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-primary text-white text-[9px] font-bold px-2.5 py-1 rounded-full tracking-widest shadow-md">Drop PR</span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <span className="text-[11px] text-gray-600 font-medium mb-1">{rcAuthor}</span>
                                                <span className="text-[10px] text-gray-400 mb-2">
                                                    {rcDate ? new Date(rcDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Recently"}
                                                </span>
                                                <h3 className="line-clamp-2 font-bold text-[15px] text-gray-900 group-hover:text-primary transition-colors mb-2"
                                                    style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                                                    {rcTitle}
                                                </h3>
                                                {rcSummary && <p className="text-[12px] text-gray-500 line-clamp-2 mb-3">{rcSummary}</p>}
                                                <div className="mt-auto pt-3 border-t border-gray-50">
                                                    <span className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                                        Read Press Release <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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

                {/* CTA */}
                <CtaSection onGetStarted={handleGetStarted} />

                {/* Back link */}
                <div className="mt-12 text-center">
                    <Link href="/press-releases" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to all press releases
                    </Link>
                </div>
            </div>

            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onSuccess={() => { setShowLogin(false); router.push("/user/dashboard/create"); }}
            />
        </div>
    );
}
