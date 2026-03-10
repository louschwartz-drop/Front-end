"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Eye, CreditCard, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import userAuthStore from "@/store/userAuthStore";

export default function PreviewPublishModal({
    isOpen,
    onClose,
    campaign,
    article,
    onPublish,
    storyPayload
}) {
    const router = useRouter();
    const { user } = userAuthStore();
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    // Filter plans that have remaining articles
    const availablePlans = (user?.planCredits || []).filter(pc => pc.remainingArticles > 0);

    // Pre-select if only one plan available
    useState(() => {
        if (availablePlans.length === 1) {
            setSelectedPlanId(availablePlans[0].planId);
        }
    }, [availablePlans]);

    const handlePublishNow = async () => {
        if (availablePlans.length === 0) {
            toast.error("No releases available. Please purchase a plan.");
            return;
        }

        if (availablePlans.length > 0 && !selectedPlanId) {
            toast.error("Please select a plan credit to use.");
            return;
        }

        console.log("XPR Media Final Payload:", JSON.stringify(storyPayload, null, 2));

        setIsPublishing(true);
        try {
            await onPublish(selectedPlanId);
            toast.success("Article published successfully!");
            onClose();
        } catch (error) {
            console.error("Error publishing:", error);
            // toast.error is handled in onPublish/caller usually, but adding for safety
        } finally {
            setIsPublishing(false);
        }
    };

    const handleGoToPayment = () => {
        router.push(`/user/pricing/${campaign._id}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Article Preview</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Warning Banner */}
                        <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 sm:gap-3">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs sm:text-sm font-semibold text-amber-900 leading-none">Important Notice</p>
                                <p className="text-[11px] sm:text-sm text-amber-700 mt-1">
                                    Once published, this article <strong>cannot be changed</strong>. Please review carefully.
                                </p>
                            </div>
                        </div>

                        {/* Article Headline Preview */}
                        <div className="px-4 sm:px-6 py-3">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-3 sm:p-5 border border-blue-100/50">
                                <p className="text-[9px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5 sm:mb-1">Article Headline</p>
                                <h3 className="text-sm sm:text-xl font-bold text-gray-900 leading-[1.3] line-clamp-2">
                                    {article?.headline || campaign?.article?.headline || "Untitled Article"}
                                </h3>
                            </div>
                        </div>

                        {/* Credit Selection Section */}
                        <div className="px-4 sm:px-6 pb-6">
                            <p className="text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">Select Credit Tier to Use:</p>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {availablePlans.length > 0 ? (
                                        availablePlans.map((plan) => (
                                            <button
                                                key={plan.planId}
                                                type="button"
                                                onClick={() => setSelectedPlanId(plan.planId)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPlanId === plan.planId
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                                                    }`}
                                            >
                                                {plan.planName}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="w-full p-3 bg-gray-100 rounded-xl text-center text-gray-600 text-[10px] sm:text-sm">
                                            No available credits in any plan tier.
                                        </div>
                                    )}
                                </div>

                                {selectedPlanId && (
                                    <p className="text-[11px] sm:text-sm text-blue-700 font-bold bg-blue-50/50 w-fit px-2 py-1 rounded-md border border-blue-100/50">
                                        {availablePlans.find(p => p.planId === selectedPlanId)?.remainingArticles || 0} releases available
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 mt-auto">
                        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 sm:flex-none sm:px-6 sm:py-2.5 px-4 py-2 border border-gray-300 rounded-xl font-medium text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleGoToPayment}
                                className="flex-1 sm:flex-none sm:px-6 sm:py-2.5 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl font-medium text-xs sm:text-sm hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" />
                                <span className="hidden xs:inline">Buy Plan</span>
                                <span className="xs:hidden">Buy</span>
                            </button>

                            {availablePlans.length > 0 && (
                                <button
                                    onClick={handlePublishNow}
                                    disabled={isPublishing}
                                    className="w-full sm:w-auto sm:px-6 sm:py-2.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium text-xs sm:text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isPublishing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Publish Now
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
