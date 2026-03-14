"use client";

import { useState } from "react";
import { X, Download, FileText, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import VideoModal from "@/components/ui/VideoModal";

export default function ArticlePreviewModal({ isOpen, onClose, campaign }) {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

    if (!isOpen || !campaign) return null;

    const displayData = campaign.article || {};
    const displayProduct = campaign.productCard || {};
    const campaignId = campaign._id || campaign.id;

    const downloadUrl = (format) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
        return `${baseUrl}/user/campaigns/${campaignId}/download/${format}`;
    };

    const handleDownload = (format) => {
        window.open(downloadUrl(format), "_blank");
        setShowDownloadDropdown(false);
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
                    {/* Header Actions */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-10">
                        {/* Download Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download
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
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                PDF Document
                                            </button>
                                            <button
                                                onClick={() => handleDownload('word')}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary flex items-center gap-2"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
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
                            <X className="w-5 h-5 md:w-6 md:h-6" />
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

                        <div className="text-sm md:text-lg text-gray-700 leading-relaxed font-medium">
                            {displayData.introduction || "No introduction generated yet."}
                        </div>

                        {/* Featured Product Block */}
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
                                        {displayProduct.productName || "Product Name"}
                                    </h4>
                                    <div className="space-y-1.5 md:space-y-2 mt-2">
                                        <p className="text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider">
                                            Details
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(campaign.article?.categories || displayData.productSummary?.category)?.split(",").map(c => c.trim()).filter(c => c).map((cat, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] md:text-xs font-bold rounded-full border border-blue-100">
                                                    {cat}
                                                </span>
                                            ))}
                                            {!campaign.article?.categories && !displayData.productSummary?.category && (
                                                <span className="text-xs text-gray-400 italic">No categories</span>
                                            )}
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-600 space-y-1 mt-2">
                                            <p><span className="font-bold opacity-60">Use case:</span> {displayData.productSummary?.useCase || "N/A"}</p>
                                            <p><span className="font-bold opacity-60">Positioning:</span> {displayData.productSummary?.positioning || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm md:text-lg text-gray-700 leading-relaxed md:leading-loose space-y-4 md:space-y-6 whitespace-pre-wrap">
                            {displayData.body || "No content generated yet."}
                        </div>

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
                                {displayProduct.productName || "the product"} could fit into your own routine,
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
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Original Source:
                                </p>
                                <button
                                    onClick={() => setIsVideoOpen(true)}
                                    className="text-blue-600 hover:text-blue-800 underline font-medium text-left transition-colors flex items-center gap-1.5"
                                >
                                    Watch Original Creator Video
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
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
