"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, CheckCircle, Clock, AlertCircle, RefreshCw, ExternalLink, Search, Download } from "lucide-react";
import { toast } from "react-toastify";
import xprArticleRelease from "@/lib/api/user/xprArticleRelease";
import apiAdmin from "@/lib/api/admin/apiAdmin";
import { distributionTargetService as userTargetService } from "@/lib/api/user/distributionTargets";
import { distributionTargetService as adminTargetService } from "@/lib/api/admin/distributionTargets";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
export default function DistributionStatusModal({ isOpen, onClose, campaignId, title, packageName, onStatusUpdate, isAdmin = false }) {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [activeTab, setActiveTab] = useState("liveAt");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchStatus = async () => {
        if (!campaignId) return;
        setLoading(true);
        try {
            let res;
            let targetsRes;
            
            if (isAdmin) {
                const [response, targets] = await Promise.all([
                    apiAdmin.get('/admin/press-releases/status-check', { params: { guid: campaignId } }),
                    adminTargetService.getAll()
                ]);
                res = response.data;
                targetsRes = targets;
            } else {
                const [response, targets] = await Promise.all([
                    xprArticleRelease.checkStatus({ guid: campaignId }),
                    userTargetService.getAll()
                ]);
                res = response;
                targetsRes = targets;
            }

            const targetsList = targetsRes?.data || [];
            const matchingTarget = targetsList.find(t => t.packageName === packageName);
            const expectedWebsiteCount = matchingTarget ? matchingTarget.expectedWebsiteCount : 0;
            const totalWebsiteCount = matchingTarget ? matchingTarget.totalWebsiteCount : 0;

            // Handle 202 (Processing) - The backend returns { success: true, message: "..." } with 202 status
            // If the message contains "processed", or if data is missing, it's likely a processing state
            if (res.success && (!res.data || (res.message && res.message.toLowerCase().includes("processed")))) {
                toast.success(res.message || "Story is being processed and will be available shortly.", { toastId: "processing-status" });
                setStatusData({
                    overallStatus: "processing",
                    destinations: [],
                    total: 0,
                    pending: 0,
                    published: 0,
                    message: res.message || "Still in progress... Your status will update soon"
                });
                setLoading(false);
                return;
            }

            if (res.success && res.data) {
                const data = res.data;

                const pendingCount = data.status?.publisherCount?.pending || 0;
                const publishedCount = data.status?.publisherCount?.live || 0;
                
                // Use static total website count from package targets instead of raw API total
                const totalCount = totalWebsiteCount > 0 ? totalWebsiteCount : (data.status?.publisherCount?.total || (pendingCount + publishedCount));
                const expectedCount = expectedWebsiteCount > 0 ? expectedWebsiteCount : totalCount;
                
                const needsReviewCount = data.needsReview?.length || 0;

                // Determine overall status using expectedWebsiteCount and 75% rule
                let overallStatus = "pending";
                if (expectedCount > 0 && (publishedCount / expectedCount) >= 0.75) overallStatus = "completed";
                else if (data.status?.isLive) overallStatus = "published";
                else if (data.status?.isReviewedDenied) overallStatus = "rejected";
                else if (data.status?.isNeedsReview) overallStatus = "needs review";
                else if (data.status?.isPartiallyLive) overallStatus = "partially live";

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

                // The user requested: pending count will be static website minus website that coming from xpr
                const computedPendingCount = Math.max(0, totalCount - publishedCount);

                const updatedStatus = {
                    overallStatus,
                    liveAt: liveAtStr,
                    pending: computedPendingCount,
                    published: publishedCount,
                    total: totalCount,
                    needsReview: needsReviewCount,
                    aiScore: data.aiAnalysis?.score || null,
                    rawLiveAt: data.liveAt || [],
                    rawPendingAt: data.pendingAt || [],
                    destinations
                };

                setStatusData(updatedStatus);

                if (typeof onStatusUpdate === "function") {
                    const isOverThreshold = expectedCount > 0 && (publishedCount / expectedCount) >= 0.75;
                    onStatusUpdate({
                        total: totalCount, // static
                        pending: computedPendingCount,
                        published: publishedCount, // actual live count
                        publishedDate: liveAtStr,
                        lastStatusCheck: new Date().toISOString(), // Instant update locally
                        isPending: isOverThreshold ? false : pendingCount > 0,
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

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        try {
            const doc = new jsPDF();
            
            // Modern Header Strip
            doc.setFillColor(10, 92, 255); // Primary Blue
            doc.rect(0, 0, doc.internal.pageSize.width, 10, "F"); 
            
            doc.setFontSize(26);
            doc.setTextColor(10, 92, 255);
            doc.setFont("helvetica", "bold");
            doc.text("Droppr.ai", 14, 30);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "bold");
            doc.text("DISTRIBUTION NETWORK REPORT", 14, 37);
            
            // Date right aligned
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            doc.setFont("helvetica", "normal");
            doc.text(dateStr, doc.internal.pageSize.width - 14, 30, { align: 'right' });
            
            // Proper Grid Layout for Metadata Boxes
            const startY = 48;
            const marginX = 14;
            const gap = 5;
            const boxWidth = (doc.internal.pageSize.width - (marginX * 2) - (gap * 2)) / 3;
            const boxHeight = 16;
            
            const boxes = [
                { label: "DISTRIBUTION PLAN", value: packageName || "Custom" },
                { label: "GUARANTEED PLACEMENTS", value: statusData.total ? `${statusData.total}+` : 'N/A' },
                { label: "CURRENTLY LIVE", value: String(statusData.rawLiveAt?.length || 0) }
            ];

            doc.setDrawColor(226, 232, 240); // Border color
            doc.setLineWidth(0.5);

            boxes.forEach((box, i) => {
                const x = marginX + (boxWidth + gap) * i;
                // Draw rounded box
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, "FD");
                
                // Label
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.setFont("helvetica", "bold");
                doc.text(box.label, x + (boxWidth / 2), startY + 6, { align: 'center' });
                
                // Value
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42);
                doc.text(box.value, x + (boxWidth / 2), startY + 12.5, { align: 'center' });
            });
            
            // Main Table
            const liveSites = statusData.rawLiveAt || [];
            const tableData = liveSites.map(site => [
                `${site.name || site.domain || "Unknown Source"}${site.network ? `\nNetwork: ${site.network}` : ''}`,
                site.source || site.url ? "View Live Article →" : "Processing Link"
            ]);
            
            autoTable(doc, {
                startY: startY + boxHeight + 12,
                head: [['PUBLICATION / NETWORK', 'LIVE ARTICLE LINK']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 6 },
                bodyStyles: { textColor: [51, 65, 85], fontSize: 9, cellPadding: 6, valign: 'middle' },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                columnStyles: {
                    0: { cellWidth: 120 }, // Give more space to the domain name
                    1: { cellWidth: 60 }   // Fixed width for the link to avoid stretching
                },
                didParseCell: function(data) {
                    if (data.section === 'body' && data.column.index === 1 && data.cell.raw === "View Live Article →") {
                        data.cell.styles.textColor = [10, 92, 255];
                        data.cell.styles.fontStyle = 'normal'; // Normalized font weight
                    } else if (data.section === 'body' && data.column.index === 1 && data.cell.raw === "Processing Link") {
                        data.cell.styles.textColor = [5, 150, 105];
                        data.cell.styles.fontStyle = 'italic'; // Italicize processing state
                    }
                },
                didDrawCell: function(data) {
                    if (data.section === 'body' && data.column.index === 1 && data.cell.raw === "View Live Article →") {
                        const rowSite = liveSites[data.row.index];
                        const url = rowSite?.source || rowSite?.url;
                        if (url) {
                            // Create clickable link area over the cell
                            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
                        }
                    }
                }
            });
            
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.line(14, doc.internal.pageSize.height - 12, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 12);
                
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Generated by Droppr.ai  •  Page ${i} of ${pageCount}`, 
                    doc.internal.pageSize.width / 2, 
                    doc.internal.pageSize.height - 6,
                    { align: 'center' }
                );
            }
            
            doc.save(`Droppr-Distribution-${packageName || 'Report'}.pdf`);
        } catch (error) {
            console.error("PDF generation failed", error);
            toast.error("Failed to generate PDF report");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

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
                    className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
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
                    <div className="p-1 md:p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50">
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
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${statusData.overallStatus === "published" || statusData.overallStatus === "completed" || statusData.overallStatus === "active" ? "bg-green-100 text-green-600"
                                            : statusData.overallStatus === "rejected" ? "bg-red-100 text-red-600"
                                                : "bg-blue-100 text-blue-600"
                                            }`}>
                                            {statusData.overallStatus === "published" || statusData.overallStatus === "completed" || statusData.overallStatus === "active" ? <CheckCircle className="w-6 h-6" />
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
                                                        Total Websites: {statusData.total}+
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

                                {statusData.overallStatus === "completed" && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-800">Distribution Completed</h4>
                                            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                                We have reached 75%+ published on our expected websites, so it is marked as complete. Due to strict website guidelines, your press release may or may not be published on the full total count.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                    {renderMetricCard(
                                        "Published",
                                        statusData.published || 0,
                                        <CheckCircle className="w-4 h-4 text-green-600" />,
                                        "bg-white border-green-200"
                                    )}
                                    {renderMetricCard(
                                        "Pending",
                                        statusData.pending || 0,
                                        <Clock className="w-4 h-4 text-amber-600" />,
                                        "bg-white border-amber-200"
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
                                                Live Websites
                                            </h4>
                                            {statusData.rawLiveAt?.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleDownloadPDF}
                                                        disabled={isGeneratingPDF}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Download className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
                                                        {isGeneratingPDF ? 'Preparing PDF...' : 'Download Report'}
                                                    </button>
                                                    <div className="relative">
                                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Search websites..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none w-48"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto bg-white custom-scrollbar">
                                            {activeTab === "liveAt" && (
                                                statusData.rawLiveAt && statusData.rawLiveAt.filter(d => !searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {statusData.rawLiveAt.filter(d => !searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((dest, idx) => (
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
                                                                <div className="flex flex-col sm:items-end shrink-0 mt-2 sm:mt-0 pl-10 sm:pl-0 gap-2">
                                                                    {dest.pubDate && (
                                                                        <div className="text-left sm:text-right">
                                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 mt-1 sm:mt-0">Published</p>
                                                                            <p className="text-[11px] sm:text-xs font-semibold text-gray-700">{new Date(dest.pubDate).toLocaleString()}</p>
                                                                        </div>
                                                                    )}
                                                                    {dest.source && (
                                                                        <a
                                                                            href={dest.source}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors w-fit sm:w-auto"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                            View Article
                                                                        </a>
                                                                    )}
                                                                </div>
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

