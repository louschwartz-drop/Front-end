"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import xprArticleRelease from "@/lib/api/user/xprArticleRelease";

export default function DistributionStatusModal({ isOpen, onClose, campaignId, title, onStatusUpdate }) {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("liveAt");

    const fetchStatus = async () => {
        if (!campaignId) return;
        setLoading(true);
        try {
            // Using campaignId as guid
            const res = await xprArticleRelease.checkStatus({ guid: campaignId });
            if (res.success && res.data) {
                const data = res.data;

                // Determine overall status
                let overallStatus = "pending";
                if (data.status?.isLive) overallStatus = "published";
                else if (data.status?.isReviewedDenied) overallStatus = "rejected";
                else if (data.status?.isNeedsReview) overallStatus = "needs review";
                else if (data.status?.isPartiallyLive) overallStatus = "partially live";

                // Metrics
                const pendingCount = data.status?.publisherCount?.pending || 0;
                const publishedCount = data.status?.publisherCount?.live || 0;
                const totalCount = data.status?.publisherCount?.total || (pendingCount + publishedCount);
                const needsReviewCount = data.needsReview?.length || 0;

                // Live Date
                let liveAtStr = null;
                if (data.liveAt && data.liveAt.length > 0) {
                    const validDates = data.liveAt
                        .map(l => new Date(l.pubDate).getTime())
                        .filter(n => !isNaN(n));
                    if (validDates.length > 0) {
                        liveAtStr = new Date(Math.min(...validDates)).toISOString();
                    } else if (data.liveAt[0]?.pubDate) {
                        liveAtStr = data.liveAt[0].pubDate;
                    }
                }

                // Networks/Destinations parsing
                const destinations = [];
                const addDestinations = (sourceArray, statusLabel) => {
                    if (Array.isArray(sourceArray)) {
                        sourceArray.forEach(pub => {
                            destinations.push({
                                status: statusLabel,
                                domain: pub.name || pub.network || pub.mediaType || "Unknown Network",
                                url: pub.url || data.link
                            });
                        });
                    }
                };

                addDestinations(data.liveAt, "published");
                addDestinations(data.pendingAt, "pending");
                addDestinations(data.needsReview, "needs review");
                addDestinations(data.deniedReview, "rejected");

                const updatedStatus = {
                    overallStatus,
                    liveAt: liveAtStr,
                    pending: pendingCount,
                    published: publishedCount,
                    total: totalCount,
                    needsReview: needsReviewCount,
                    aiScore: data.aiAnalysis?.score || null,
                    rawLiveAt: data.liveAt || [],
                    rawPendingAt: data.pendingAt || [],
                    destinations
                };

                setStatusData(updatedStatus);

                // Notify parent to update dashboard card locally (Just Now effect)
                if (typeof onStatusUpdate === "function") {
                    onStatusUpdate({
                        total: totalCount,
                        pending: pendingCount,
                        publishedDate: liveAtStr,
                        lastStatusCheck: new Date().toISOString(), // Instant update locally
                        isPending: pendingCount > 0,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch distribution status:", error);
            if (error.response?.status === 404) {
                // Return a special state for "Preparing / Processing"
                setStatusData({
                    overallStatus: "processing",
                    destinations: [],
                    total: 0,
                    pending: 0,
                    published: 0,
                    message: "Still in progress... Your status will update soon"
                });
            } else {
                toast.error("Failed to fetch distribution status.", { toastId: "status-fetch-err" });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStatus();
        } else {
            setStatusData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, campaignId]);

    if (!isOpen) return null;

    const renderMetricCard = (label, value, icon, colorClass) => (
        <div className={`py-4 px-2 rounded-xl border ${colorClass} flex items-start  shadow-sm relative overflow-hidden`}>
            {/* Background Accent */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 ${colorClass.replace("border-", "bg-").replace("bg-white", "").split(" ")[0]}`}></div>

            <div className={`p-1.5 pt-0 rounded-lg shrink-0 ${colorClass.replace("border-", "bg-").replace("bg-white", "").replace("50", "100")}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 truncate">{label}</p>
                <div className="flex items-end gap-1 text-base sm:text-lg font-black text-gray-900 leading-none truncate">
                    {value !== undefined ? value : "-"}
                </div>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Live Distribution Status</h2>
                                <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] sm:max-w-[400px]">
                                    {title || "Press Release Tracking"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchStatus}
                                disabled={loading}
                                className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500 disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400 group"
                            >
                                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50">
                        {loading && !statusData ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-sm font-semibold text-gray-600 animate-pulse">Fetching latest updates from network...</p>
                            </div>
                        ) : !statusData ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Status Unavailable</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">We couldn't retrieve the live status for this article right now. Please try again later.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Overall Status Banner */}
                                <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${statusData.overallStatus === "published" || statusData.overallStatus === "active" ? "bg-green-100 text-green-600"
                                            : statusData.overallStatus === "rejected" ? "bg-red-100 text-red-600"
                                                : "bg-blue-100 text-blue-600"
                                            }`}>
                                            {statusData.overallStatus === "published" || statusData.overallStatus === "active" ? <CheckCircle className="w-6 h-6" />
                                                : statusData.overallStatus === "rejected" ? <AlertCircle className="w-6 h-6" />
                                                    : <Clock className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Network Status</p>
                                            <h3 className="text-xl font-black text-gray-900 capitalize flex items-center gap-2">
                                                {statusData.overallStatus || "Processing"}
                                                {(statusData.overallStatus === "pending" || !statusData.overallStatus) && (
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                )}
                                                {statusData.total > 0 && (
                                                    <span className="ml-2 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full bg-gray-100 text-gray-600 uppercase border border-gray-200 shadow-sm">
                                                        Total Websites: {statusData.total}
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                    </div>

                                    {statusData.liveAt && (
                                        <div className="text-right bg-gray-50 py-2 px-4 rounded-xl border border-gray-100 w-full sm:w-auto">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 items-center flex justify-center sm:justify-end gap-1">
                                                <Activity className="w-3 h-3" /> Live Since
                                            </p>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {new Date(statusData.liveAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                    {renderMetricCard(
                                        "Pending",
                                        statusData.pending || 0,
                                        <Clock className="w-4 h-4 text-amber-600" />,
                                        "bg-white border-amber-200"
                                    )}
                                    {renderMetricCard(
                                        "Published",
                                        statusData.published || 0,
                                        <CheckCircle className="w-4 h-4 text-green-600" />,
                                        "bg-white border-green-200"
                                    )}
                                    {renderMetricCard(
                                        "Needs Review",
                                        statusData.needsReview || 0,
                                        <AlertCircle className="w-4 h-4 text-purple-600" />,
                                        "bg-white border-purple-200"
                                    )}
                                    {renderMetricCard(
                                        "AI Score",
                                        statusData.aiScore ? `${statusData.aiScore}%` : "N/A",
                                        <Activity className="w-4 h-4 text-indigo-600" />,
                                        "bg-white border-indigo-200"
                                    )}
                                </div>

                                {/* Network Destinations Tabs */}
                                {(statusData.rawLiveAt?.length > 0 || statusData.rawPendingAt?.length > 0 || true) && (
                                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-gray-400" />
                                                Network Destinations
                                            </h4>
                                        </div>
                                        <div className="flex border-b border-gray-200">
                                            <button
                                                onClick={() => setActiveTab("liveAt")}
                                                className={`flex-1 py-3 text-[13px] sm:text-sm font-bold transition-colors ${activeTab === "liveAt" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                Live At ({statusData.rawLiveAt?.length || 0})
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("pendingAt")}
                                                className={`flex-1 py-3 text-[13px] sm:text-sm font-bold transition-colors ${activeTab === "pendingAt" ? "text-amber-600 border-b-2 border-amber-600 bg-amber-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                Pending At ({statusData.rawPendingAt?.length || 0})
                                            </button>
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto bg-white">
                                            {activeTab === "liveAt" && (
                                                statusData.rawLiveAt && statusData.rawLiveAt.length > 0 ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {statusData.rawLiveAt.map((dest, idx) => (
                                                            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                <div className="flex items-start gap-3 sm:gap-4">
                                                                    <div className="p-1.5 mt-0.5 rounded-full bg-green-100 text-green-600 shrink-0">
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900">{dest.name || "Unknown Source"}</p>
                                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] sm:text-xs text-gray-500">
                                                                            {dest.network && <span><span className="font-semibold text-gray-700">Network:</span> {dest.network}</span>}
                                                                            {dest.mediaType && <span><span className="font-semibold text-gray-700">Type:</span> {dest.mediaType}</span>}
                                                                            {(dest.city || dest.state) && (
                                                                                <span>
                                                                                    <span className="font-semibold text-gray-700">Location:</span> {dest.city}{dest.city && dest.state ? ", " : ""}{dest.state}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {dest.pubDate && (
                                                                    <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 pl-10 sm:pl-0">
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 mt-1 sm:mt-0">Published</p>
                                                                        <p className="text-[11px] sm:text-xs font-semibold text-gray-700">{new Date(dest.pubDate).toLocaleString()}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-10 px-4 text-center text-gray-500 flex flex-col items-center">
                                                        <AlertCircle className="w-8 h-8 mb-3 text-gray-300" />
                                                        <p className="text-sm font-medium">No live websites currently available.</p>
                                                    </div>
                                                )
                                            )}

                                            {activeTab === "pendingAt" && (
                                                statusData.rawPendingAt && statusData.rawPendingAt.length > 0 ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {statusData.rawPendingAt.map((dest, idx) => (
                                                            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 sm:gap-4">
                                                                <div className="p-1.5 rounded-full bg-amber-100 text-amber-600 shrink-0">
                                                                    <Clock className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{dest.name || "Pending Network"}</p>
                                                                    {dest.network && <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5"><span className="font-semibold text-gray-700">Network:</span> {dest.network}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-10 px-4 text-center text-gray-500 flex flex-col items-center">
                                                        <CheckCircle className="w-8 h-8 mb-3 text-green-300" />
                                                        <p className="text-sm font-medium">No pending websites in queue at this time.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

