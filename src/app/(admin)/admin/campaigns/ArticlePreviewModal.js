"use client";

import { X } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ArticlePreviewModal({ isOpen, onClose, campaign }) {
    if (!isOpen || !campaign) return null;

    const article = campaign.article || {};
    const {
        headline = "No Headline",
        introduction = "No introduction generated yet.",
        body = "No content generated yet.",
        conclusion = "No conclusion generated yet.",
        productSummary = {}
    } = article;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        Preview Article: {campaign.campaignId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                    {/* Article Header */}
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                            {headline}
                        </h1>
                        {article.locationDate && (
                            <p className="text-sm text-gray-500 italic">
                                {article.locationDate}
                            </p>
                        )}
                    </div>

                    {/* Introduction */}
                    {introduction && (
                        <div className="prose max-w-none text-gray-700">
                            <p className="whitespace-pre-wrap">{introduction}</p>
                        </div>
                    )}

                    {/* Body */}
                    {body && (
                        <div className="prose max-w-none text-gray-700">
                            <p className="whitespace-pre-wrap">{body}</p>
                        </div>
                    )}

                    {/* Product Summary Box */}
                    {(productSummary.category || productSummary.useCase) && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 my-4">
                            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-2">Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800">
                                {productSummary.category && <p><span className="font-medium">Category:</span> {productSummary.category}</p>}
                                {productSummary.useCase && <p><span className="font-medium">Use Case:</span> {productSummary.useCase}</p>}
                                {productSummary.positioning && <p><span className="font-medium">Positioning:</span> {productSummary.positioning}</p>}
                            </div>
                        </div>
                    )}

                    {/* Conclusion */}
                    {conclusion && (
                        <div className="prose max-w-none text-gray-700">
                            <p className="whitespace-pre-wrap">{conclusion}</p>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            console.log("Start Distributing Now clicked for", campaign._id);
                            // Future implementation: trigger distribution
                        }}
                    >
                        Start Distributing Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
