"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function FullArticlePreview({ isOpen, onClose, campaign, article, productCard }) {
    if (!isOpen) return null;

    const displayData = article || campaign?.article || {};
    const displayProduct = productCard || campaign?.productCard || {};

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
                    className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl md:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-12 article-preview"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-gray-600 z-10"
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

                    <div className="max-w-2xl mx-auto space-y-4 md:space-y-8">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            {displayData.headline}
                        </h2>

                        {displayData.summary && (
                            <div className="text-sm md:text-lg text-gray-800 leading-relaxed font-semibold italic border-l-4 border-[#0A5CFF] pl-4 py-1">
                                {displayData.summary}
                            </div>
                        )}

                        <div className="text-sm md:text-lg text-gray-700 leading-relaxed font-medium">
                            {displayData.introduction}
                        </div>

                        <div className="text-sm md:text-lg text-gray-700 leading-relaxed md:leading-loose space-y-4 md:space-y-6 whitespace-pre-wrap">
                            {displayData.body}
                        </div>

                        {/* Creator Quote Section */}
                        {displayData.creatorQuote && (
                            <div className="py-4 md:py-8 border-y border-gray-100 flex flex-col items-center gap-2 md:gap-4">
                                <div className="italic text-base md:text-xl text-gray-800 text-center leading-relaxed font-serif">
                                    "{displayData.creatorQuote}"
                                </div>
                                {displayProduct.authorName && (
                                    <div className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">
                                        — {displayProduct.authorName}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Preview Product Block */}
                        <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8 border border-gray-100 my-6 md:my-10">
                            <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4 block text-center md:text-left">
                                Featured Product
                            </span>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-8 text-center sm:text-left">
                                {displayProduct.thumbnail && (
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
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
                                    <div className="space-y-0.5 md:space-y-1">
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Category: {displayData.productSummary?.category}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Use case: {displayData.productSummary?.useCase}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-600">
                                            Positioning: {displayData.productSummary?.positioning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                    className="text-[#0A5CFF] underline break-all font-medium text-xs md:text-base"
                                >
                                    {displayProduct.affiliateLink || "[Affiliate Link]"}
                                </a>
                            </div>
                        </div>

                        <div className="pt-6 md:pt-8 border-t border-gray-100 text-[10px] md:text-sm text-gray-500 flex flex-col gap-3 md:gap-4">
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Original Source:
                                </p>
                                <a
                                    href={displayProduct.sourceVideoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline break-all"
                                >
                                    {displayProduct.sourceVideoLink || "Watch original creator video"}
                                </a>
                            </div>
                            <p className="">
                                {displayProduct.authorName &&
                                    `© ${new Date().getFullYear()} ${displayProduct.authorName}`}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
