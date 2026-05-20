"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import VideoModal from "@/components/ui/VideoModal";
import { downloadCampaignFile, printArticleAsPdf } from "@/utils/downloadHelper";
import { BLOCKQUOTE_STYLES } from "@/components/editor/blockquoteStyles";

export const STANDARD_FOOTER = `
<div style='margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;'>
  <h4 style='text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-size:0.875rem;margin-bottom:1rem;'>Media Contact</h4>
  <p style='margin:0;font-weight:700;color:#111827;'>Droppr AI Research & Media Desk</p>
  <p style='margin:4px 0;color:#4b5563;'>support@droppr.ai</p>
  <p style='margin:4px 0;color:#4b5563;'>Austin, Texas</p>
</div>
<div style='margin-top:2.5rem;padding:1.5rem;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;'>
  <h4 style='margin-top:0;color:#111827;'>About Drop PR</h4>
  <p style='margin-bottom:1rem;color:#374151;line-height:1.7;'><a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a> transforms creator videos, podcasts, product reviews, and brand announcements into professionally written editorial-style articles distributed across a broad network of digital publishers. The platform helps brands, creators, agencies, and e-commerce companies expand search visibility, strengthen AI discoverability, generate backlinks, and extend the lifespan of short-form content beyond social media feeds.</p>
  <h4 style='margin-top:1.5rem;color:#111827;'>Call to Action</h4>
  <p style='margin-bottom:0;color:#374151;line-height:1.7;'>Brands, creators, podcasters, and agencies interested in turning content into distributed editorial coverage can learn more at <a href='https://droppr.ai' target='_blank' style='color:#0A5CFF;font-weight:600;text-decoration:underline;'>Drop PR</a>.</p>
</div>
`;

export function stripFooter(html) {
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

export default function FullArticlePreview({ isOpen, onClose, campaign, article, productCard }) {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    // Use a more robust way to get the ID, checking both campaign and provided article
    const campaignId = campaign?._id || campaign?.id || article?._id || article?.id;
    
    const displayData = article || campaign?.article || {};
    const displayProduct = productCard || campaign?.productCard || {};

    const handleDownload = async (format) => {
        setShowDownloadDropdown(false);

        if (format === 'pdf') {
            try {
                printArticleAsPdf({
                    displayData,
                    displayProduct,
                    standardFooter: STANDARD_FOOTER,
                    stripFooter
                });
                toast.success("PDF generation started in your browser!");
            } catch (error) {
                console.error("Client-side PDF printing failed:", error);
                toast.error("Failed to generate PDF. Please try again.");
            }
            return;
        }

        if (!campaignId || campaignId === "undefined") {
            console.error("No campaign ID found for download");
            toast.error("Error: Campaign ID missing. Please try refreshing the page.");
            return;
        }

        setIsDownloading(true);

        try {
            await downloadCampaignFile(campaignId, format);
            toast.success(`${format.toUpperCase()} download started`);
        } catch (error) {
            toast.error(`Failed to download ${format}. Please try again.`);
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-12 article-preview scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/50 scrollbar-track-transparent"
                >
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-10">
                        {/* Download Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                            >
                                <svg className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isDownloading ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    )}
                                </svg>
                                {isDownloading ? "Processing..." : "Download"}
                            </button>
                            
                            <AnimatePresence>
                                {showDownloadDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowDownloadDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20"
                                        >
                                            <button
                                                onClick={() => handleDownload('pdf')}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                                                </svg>
                                                PDF Document
                                            </button>
                                            <button
                                                onClick={() => handleDownload('word')}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H10z" />
                                                </svg>
                                                Word Document
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition-all"
                        >
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-4 md:space-y-8 pt-12 md:pt-0">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            {displayData.headline}
                        </h2>

                        {displayData.summary && (
                            <div className="text-sm md:text-lg text-gray-800 leading-relaxed font-semibold italic border-l-4 border-primary pl-4 py-1">
                                {displayData.summary}
                            </div>
                        )}

                        {displayData.introduction && (
                            <div className="text-sm md:text-lg text-gray-700 leading-relaxed font-medium">
                                {displayData.introduction}
                            </div>
                        )}

                        {/* Preview Product Block Moved Higher */}
                        <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-100 my-6 md:my-10">
                            <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4 block text-center md:text-left">
                                Featured Product
                            </span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-8 text-center sm:text-left">
                                {displayProduct.thumbnail && (
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm shrink-0">
                                        <img
                                            src={displayProduct.thumbnail}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1 md:space-y-2">
                                    <h4 className="text-lg md:text-xl font-bold text-gray-900">
                                        {displayProduct.productName}
                                    </h4>
                                    <div className="space-y-1.5 md:space-y-2 mt-2">
                                        <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider">
                                            Details
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(displayData.categories || displayData.productSummary?.category)?.split(",").map(c => c.trim()).filter(c => c).map((cat, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] md:text-xs font-bold rounded-full border border-blue-100">
                                                    {cat}
                                                </span>
                                            ))}
                                            {!displayData.categories && !displayData.productSummary?.category && (
                                                <span className="text-xs text-gray-400 italic">No categories</span>
                                            )}
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600 space-y-1 mt-2">
                                            <p><span className="font-bold opacity-60">Use case:</span> {displayData.productSummary?.useCase}</p>
                                            <p><span className="font-bold opacity-60">Positioning:</span> {displayData.productSummary?.positioning}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Styled HTML Body Rendering */}
                        <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />
                        <div 
                            className="text-sm md:text-lg text-gray-700 leading-relaxed md:leading-loose space-y-4 md:space-y-6 html-content-preview article-html"
                            dangerouslySetInnerHTML={{ __html: `<div>${stripFooter(displayData.body || "")}${STANDARD_FOOTER}</div>` }}
                        />

                        {/* Creator Quote Section */}
                        {displayData.creatorQuote && (
                            <div className="py-4 md:py-8 border-y border-gray-100 flex flex-col items-center gap-2 md:gap-4">
                                <div className="italic text-base md:text-xl text-gray-800 text-center leading-relaxed font-serif">
                                    "{displayData.creatorQuote}"
                                </div>
                                {displayProduct.authorName && (
                                    <div className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">
                                        From {displayProduct.authorName}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 md:space-y-4">
                            <h4 className="text-xl md:text-2xl font-bold text-gray-900">
                                Purchase Information
                            </h4>
                            <p className="text-sm md:text-lg text-gray-600 italic leading-relaxed">
                                If you've seen the video and wondered whether{" "}
                                {displayProduct.productName} could fit into your own routine,
                                product details, pricing, and availability are available through
                                the official product page.
                            </p>
                            <div className="pt-2 md:pt-4 space-y-1 md:space-y-2">
                                <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Product Page:
                                </p>
                                <a
                                    href={displayProduct.affiliateLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-blue-700 underline font-semibold text-xs md:text-base transition-colors flex items-center gap-1.5 w-fit"
                                >
                                    Click here to see product
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div className="pt-6 md:pt-8 border-t border-gray-100 text-[10px] md:text-sm text-gray-500 flex flex-col gap-3 md:gap-4">
                            {campaign?.videoSource !== "document_upload" && (
                                <div className="space-y-1 md:space-y-2">
                                    <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Original Source:
                                    </p>
                                    <button
                                        onClick={() => setIsVideoOpen(true)}
                                        className="text-blue-500 hover:text-blue-700 underline font-medium text-left transition-colors flex items-center gap-1.5"
                                    >
                                        Watch Original Creator Video
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {campaign?.videoSource === "document_upload" && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 w-fit">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs font-bold uppercase tracking-tight">Article Generated from Document</span>
                                </div>
                            )}
                            <p className="">
                                {displayProduct.authorName &&
                                    `© ${new Date().getFullYear()} ${displayProduct.authorName}`}
                            </p>
                        </div>
                    </div>

                    <VideoModal 
                        isOpen={isVideoOpen} 
                        onClose={() => setIsVideoOpen(false)} 
                        videoUrl={displayProduct.sourceVideoLink} 
                    />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
