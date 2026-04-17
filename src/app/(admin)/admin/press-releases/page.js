"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileText, Eye, Clock, CheckCircle, Search, Filter, 
    ChevronLeft, ChevronRight, Play, User, Globe, Activity, Flag, Calendar, X
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import { adminPressReleaseService } from "@/lib/api/admin/press-releases";
import DistributionStatusModal from "@/components/user/DistributionStatusModal";
import Pagination from "@/components/ui/Pagination";
import FullArticlePreview from "@/components/user/FullArticlePreview";

export default function AdminPressReleasesPage() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [previewModal, setPreviewModal] = useState({
        show: false,
        campaign: null,
    });
    const [statusModal, setStatusModal] = useState({
        show: false,
        campaignId: null,
        title: "",
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    const loadReleases = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                search,
                status: statusFilter !== "all" ? statusFilter : undefined,
                date: dateFilter || undefined
            };
            const res = await adminPressReleaseService.getAll(params);

            if (res.success) {
                setReleases(res.data);
                setTotalPages(res.pagination.totalPages);
                setTotalResults(res.pagination.total);
            }
        } catch (error) {
            console.error('Error loading press releases for admin:', error);
            toast.error("Failed to load press releases");
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((query) => {
            setCurrentPage(1);
            loadReleases(1, query);
        }, 500),
        [statusFilter, dateFilter]
    );

    useEffect(() => {
        loadReleases(currentPage, searchTerm);
    }, [currentPage, statusFilter, dateFilter]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setDateFilter("");
        setSearchTerm("");
        setCurrentPage(1);
    };

    const getStatusStyle = (status, release) => {
        if (release.distributionStatus?.needsReview) return "bg-rose-100 text-rose-700 border-rose-200";
        if (release.distributionStatus?.isPending) return "bg-amber-100 text-amber-700 border-amber-200";

        switch (status) {
            case "published": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "submitted_successfully": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "pending": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusLabel = (release) => {
        if (release.distributionStatus?.needsReview) return "FLAGGED / REVIEW";
        if (release.distributionStatus?.isPending) return "IN PROGRESS";
        if (release.status === "published" || (!release.distributionStatus?.isPending && release.distributionStatus?.total > 0)) return "FINISHED";
        return release.status.toUpperCase();
    };

    const handlePublishToSyndicate = (releaseId) => {
        toast.info("Publish to Syndicate functionality is coming soon.");
    };

    const getRelativeTime = (date) => {
        if (!date) return "";
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) {
            if (now.getDate() === past.getDate()) {
                return `Today, ${Math.floor(diffInSeconds / 3600)}h ago`;
            }
            return "Yesterday";
        }
        if (diffInSeconds < 172800) return "Yesterday";
        return past.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Press Release Management</h1>
                <p className="text-gray-600 mt-2">
                    Oversee and syndicate press releases across all users
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">

                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-40 p-2 outline-none transition-all cursor-pointer hover:border-primary/40"
                        />
                    </div>
                    {(statusFilter !== "all" || dateFilter !== "" || searchTerm !== "") && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: "all", label: "All Press Releases" },
                        { id: "in-progress", label: "In Progress", color: "amber" },
                        { id: "finished", label: "Finished", color: "emerald" },
                        { id: "pending", label: "Queued", color: "blue" }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => {
                                setStatusFilter(f.id);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${statusFilter === f.id
                                ? "bg-gray-900 text-white border-gray-900 shadow-sm scale-105"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                                }`}
                        >
                            {f.id !== "all" && (
                                <div className={`w-2 h-2 rounded-full bg-${f.color}-500 shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                            )}
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative group flex-1 md:flex-none">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search headline or user..."
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium text-xs"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {loading && releases.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium tracking-tight">Loading press releases...</p>
                </div>
            ) : releases.length === 0 ? (
                <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <div className="p-4 md:p-6 bg-gray-50 rounded-full">
                            <FileText className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                        </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2 tracking-tight">No Press Releases Found</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 max-w-xs md:max-w-sm mx-auto font-medium px-4">
                        {searchTerm || statusFilter !== "all" || dateFilter !== "" 
                            ? "No results match your search and filter criteria." 
                            : "There are no press releases submitted yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {releases.map((release, index) => (
                            <motion.div
                                key={release._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6"
                            >
                                <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                    <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
                                        {(release.campaign?.productCard?.thumbnail || release.campaign?.videoThumbnail) ? (
                                            <img
                                                src={release.campaign.productCard?.thumbnail || release.campaign.videoThumbnail}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                                <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-sm md:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                {release.campaign?.article?.headline || "Untitled Press Release"}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-bold italic mt-1">
                                                <User className="w-3 h-3" />
                                                <div className="flex items-center gap-1.5">
                                                    <span>{release.user?.name} · {release.user?.email}</span>
                                                    {release.user?._id && (
                                                        <Link 
                                                            href={`/admin/users/${release.user._id}/press-releases`}
                                                            className="text-gray-400 hover:text-primary transition-colors inline-flex items-center ml-1"
                                                            title="View user press releases"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 md:gap-y-2 mt-2 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-blue-100">
                                                {release.plan?.name || "Standard Plan"}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(release.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}
                                            </span>
                                            {release.distributionStatus?.total > 0 && (
                                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    <CheckCircle className="w-2.5 h-2.5" />
                                                    {release.distributionStatus.total} Websites
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                                    <span className={`px-3 py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest border transition-all flex items-center gap-1.5 ${getStatusStyle(release.status, release)}`}>
                                        {release.distributionStatus?.needsReview && <Flag className="w-3 h-3 fill-current" />}
                                        {getStatusLabel(release)}
                                    </span>

                                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => setPreviewModal({ show: true, campaign: release.campaign })}
                                            className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-blue-600"
                                            title="View Article"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setStatusModal({ show: true, campaignId: release.campaign?._id, title: release.campaign?.article?.headline })}
                                            className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-blue-500 hover:text-blue-700"
                                            title="View Distribution Status"
                                        >
                                            <Activity className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalResults={totalResults}
                        itemsPerPage={10}
                        className="mt-0"
                    />
                </div>
            )}

            {/* Full Article Preview */}
            <FullArticlePreview
                isOpen={previewModal.show}
                onClose={() => setPreviewModal({ show: false, campaign: null })}
                campaign={previewModal.campaign}
                article={previewModal.campaign?.article}
                productCard={previewModal.campaign?.productCard}
            />

            {/* Live Distribution Status Modal */}
            <DistributionStatusModal
                isOpen={statusModal.show}
                onClose={() => setStatusModal({ show: false, campaignId: null, title: "" })}
                campaignId={statusModal.campaignId}
                title={statusModal.title}
                onStatusUpdate={(newStatus) => {
                    setReleases(prev => prev.map(r =>
                        r.campaign?._id === statusModal.campaignId
                            ? { ...r, distributionStatus: newStatus }
                            : r
                    ));
                }}
            />
        </div>
    );
}
