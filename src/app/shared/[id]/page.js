"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter, notFound } from "next/navigation";
import { publicCampaignService } from "@/lib/api/public/campaigns";
import { campaignService } from "@/lib/api/user/campaigns";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, ArrowRight, Edit3, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";

function closeUnclosedTags(html) {
    if (!html) return "";
    let cleanedHtml = html;
    const lastOpenBracket = cleanedHtml.lastIndexOf("<");
    const lastCloseBracket = cleanedHtml.lastIndexOf(">");
    if (lastOpenBracket > lastCloseBracket) {
        cleanedHtml = cleanedHtml.substring(0, lastOpenBracket).trim();
    }
    const tagStack = [];
    const tagRegex = /<(\/?)([a-z0-9]+)(?:\s+[^>]*)*>/gi;
    let match;
    while ((match = tagRegex.exec(cleanedHtml)) !== null) {
        const isClosing = match[1] === "/";
        const tagName = match[2].toLowerCase();
        const voidElements = ["img", "br", "hr", "input", "meta", "link", "source", "embed", "col", "area"];
        if (voidElements.includes(tagName)) continue;
        if (isClosing) {
            const index = tagStack.lastIndexOf(tagName);
            if (index !== -1) tagStack.splice(index, 1);
        } else {
            tagStack.push(tagName);
        }
    }
    for (let i = tagStack.length - 1; i >= 0; i--) {
        cleanedHtml += `</${tagStack[i]}>`;
    }
    return cleanedHtml;
}

function stripFooter(html, isDocumentUpload = false) {
    if (!html) return "";
    if (isDocumentUpload) return closeUnclosedTags(html);
    const markers = ["Media Contact", "<h4>Media Contact</h4>", "<div style='margin-top:3rem;"];
    let stripped = html;
    for (const m of markers) {
        const idx = html.indexOf(m);
        if (idx !== -1) {
            stripped = html.substring(0, idx).trim();
            break;
        }
    }
    return closeUnclosedTags(stripped);
}

function initials(name = "DropPR") {
    return name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
}

function Img({ src, fallback, alt, className }) {
    const good = src && src !== "None" && src !== "";
    const [cur, setCur] = useState(good ? src : fallback);
    useEffect(() => { setCur(good ? src : fallback); }, [src, fallback]);
    return (
        <img src={cur} alt={alt} className={className} onError={(e) => { e.target.onerror = null; setCur(fallback); }} />
    );
}

function SharedCtaSection({ onEdit, onPublish }) {
    return (
        <section className="max-w-4xl mx-auto mt-12 px-6">
            <div className="bg-gradient-to-r from-slate-900 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <h2 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-6 relative z-10">
                    You have access to this Campaign!
                </h2>
                <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto relative z-10">
                    In a single click, you can promote your product and increase the authority of your site. Claim this article or publish it instantly on 1,000+ websites!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                    <button
                        onClick={onEdit}
                        title="Personalize this article before publishing"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl transition-all w-full sm:w-auto justify-center"
                    >
                        <Edit3 className="w-5 h-4" />
                        Edit Article
                    </button>
                    <button
                        onClick={onPublish}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:shadow-xl transition-all scale-100 hover:scale-105 w-full sm:w-auto justify-center"
                    >
                        Publish Now
                        <ShoppingCart className="w-5 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default function SharedCampaignPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingClaim, setIsCheckingClaim] = useState(true);
    const [error, setError] = useState(null);

    const id = params?.id;
    const token = searchParams.get("token");

    useEffect(() => {
        const fetchSharedCampaign = async () => {
            if (!id || !token) {
                setError("Invalid share link. Missing ID or token.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await publicCampaignService.getSharedCampaign(id, token);
                if (response.success) {
                    setCampaign(response.data);
                } else {
                    setError(response.message || "Failed to load campaign.");
                }
            } catch (err) {
                console.error("Error fetching shared campaign:", err);
                setError(err?.response?.data?.message || "Campaign not found or link has expired.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedCampaign();
    }, [id, token]);

    // Check if the user already claimed or owns this campaign
    useEffect(() => {
        if (status === "loading") return; // Wait for session state to resolve

        if (status === "authenticated" && id && token) {
            campaignService.checkClaimStatus(id, token)
                .then(res => {
                    if (res.success && res.hasClaimed && res.redirectId) {
                        router.push(`/user/edit/${res.redirectId}`);
                        // Don't set isCheckingClaim = false here to prevent rendering the UI before redirect
                    } else {
                        setIsCheckingClaim(false);
                    }
                })
                .catch(err => {
                    console.error("Error checking claim status:", err);
                    setIsCheckingClaim(false);
                });
        } else {
            // Not authenticated or no ID
            setIsCheckingClaim(false);
        }
    }, [status, id, router]);

    const handleAction = (action) => {
        const returnUrl = encodeURIComponent(`/shared-claim?campaignId=${id}&token=${token}&action=${action}`);
        if (!session) {
            router.push(`/user/auth?returnTo=${returnUrl}`);
        } else {
            router.push(`/shared-claim?campaignId=${id}&token=${token}&action=${action}`);
        }
    };

    if (isLoading || isCheckingClaim || status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#fafaf7" }}>
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Loading Campaign...</p>
            </div>
        );
    }

    if (error || !campaign) {
        return notFound();
    }

    const displayData = campaign.article || {};
    const productCard = campaign.productCard || {};
    const headline = displayData.headline || "Press Release";
    const authorName = productCard.authorName || "DropPR Author";
    const isDocUpload = campaign.videoSource === "document_upload";

    return (
        <div style={{ background: "#fafaf7", minHeight: "100vh" }}>
            <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />

            <div className="pt-12 pb-20">
                <article className="max-w-3xl mx-auto px-6">
                    
                    {/* Title */}
                    <h1
                        className="text-3xl md:text-[46px] leading-tight md:leading-[1.08]"
                        style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 700, letterSpacing: "-0.025em", marginBottom: "20px", color: "#0a0e1a" }}
                    >
                        {headline}
                    </h1>

                    {/* Summary */}
                    {displayData.summary && (
                        <div
                            className="text-lg md:text-[22px] leading-normal md:leading-[1.45]"
                            style={{ color: "#5f5f5f", fontStyle: "italic", marginBottom: "32px", fontFamily: "Charter, Georgia, serif" }}
                        >
                            {displayData.summary}
                        </div>
                    )}

                    <hr className="border-gray-200 mb-6" />

                    {/* Author row */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-black">{initials(authorName)}</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Published by: {authorName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                    {campaign.createdAt
                                        ? new Date(campaign.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
                                        : "Recently"}
                                </span>
                                {displayData.category && (
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{displayData.category}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-200 mb-8" />

                    {/* Featured product block */}
                    {productCard.productName && (
                        <div className="bg-[#f2f2ee] rounded-2xl p-4 md:p-6 border border-gray-200/50 mb-8">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Featured Product</span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                {productCard.thumbnail && (
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                                        <Img src={productCard.thumbnail} fallback="/fallback-platform.jpeg" alt="Product" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-gray-900">{productCard.productName}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(displayData.categories || displayData.productSummary?.category)?.split(",").map(c => c.trim()).filter(Boolean).map((cat, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                                        {displayData.productSummary?.useCase && <div><span className="font-bold opacity-60">Use case:</span> {displayData.productSummary.useCase}</div>}
                                        {displayData.productSummary?.positioning && <div><span className="font-bold opacity-60">Positioning:</span> {displayData.productSummary.positioning}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div className="blog-content space-y-6 text-gray-800">
                        {displayData.body && /<[a-z][\s\S]*>/i.test(displayData.body) ? (
                            <div className="html-content-preview article-html"
                                dangerouslySetInnerHTML={{ __html: `<div>${stripFooter(displayData.body, isDocUpload)}</div>` }} />
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">{stripFooter(displayData.body, isDocUpload)}</div>
                        )}
                        {displayData.conclusion && (
                            <div className="mt-8 font-medium italic text-gray-700">{displayData.conclusion}</div>
                        )}
                    </div>

                    {/* Creator quote */}
                    {displayData.creatorQuote && (
                        <div className="py-6 my-8 border-y border-gray-200/60 text-center">
                            <p className="italic text-base md:text-xl text-gray-800 font-serif">&ldquo;{displayData.creatorQuote}&rdquo;</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">From {authorName}</p>
                        </div>
                    )}

                    {/* Purchase info */}
                    {!isDocUpload && productCard.affiliateLink && (
                        <div className="space-y-3 mt-10">
                            <h4 className="text-lg font-bold text-gray-900">Purchase Information</h4>
                            <a href={productCard.affiliateLink} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 underline font-semibold text-sm flex items-center gap-1.5 w-fit">
                                Click here to see product
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    )}

                    {/* Source / footer */}
                    <div className="pt-6 mt-8 border-t border-gray-200/60 text-xs text-gray-500 flex flex-col gap-3">
                        {!isDocUpload && productCard.sourceVideoLink && (
                            <a href={productCard.sourceVideoLink} target="_blank" rel="noopener noreferrer"
                                className="text-blue-500 underline font-medium flex items-center gap-1.5">
                                Watch Original Creator Video
                            </a>
                        )}
                        {isDocUpload && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 w-fit uppercase tracking-tight">
                                Article Generated from Document
                            </span>
                        )}
                        <p className="text-[11px] opacity-80">
                            © {new Date().getFullYear()} {authorName}
                        </p>
                    </div>
                </article>

                {/* Shared Action CTA Box (Matches the specific design requested) */}
                <SharedCtaSection 
                    onEdit={() => handleAction('edit')} 
                    onPublish={() => handleAction('publish')} 
                />

                {/* About DropPR */}
                <div className="max-w-3xl mx-auto px-6 mt-16">
                    <div className="border-t border-gray-200 pt-8">
                        <h4 className="text-xs font-black text-gray-400 mb-3">
                            <Link href="/" className="hover:text-blue-600 transition-colors">About DropPR</Link>
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            <Link href="/" className="text-blue-600 font-semibold hover:underline">DropPR</Link>{" "}
                            transforms creator videos, podcasts, product reviews, and brand announcements into professionally
                            written editorial-style articles distributed across a broad network of digital publishers. The platform
                            helps brands, creators, agencies, and e-commerce companies expand search visibility, strengthen AI
                            discoverability, generate backlinks, and extend the lifespan of short-form content beyond social media feeds.
                        </p>
                        <h4 className="text-xs font-black text-gray-400 mb-3">Call to Action</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Brands, creators, podcasters, and agencies interested in turning content into distributed editorial coverage
                            can learn more at <Link href="/" className="text-blue-600 font-semibold hover:underline">DropPR</Link>.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
