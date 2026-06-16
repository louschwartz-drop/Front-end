"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, Eye, Clock, CheckCircle, Search, Filter,
    ChevronLeft, ChevronRight, Play, User, Globe, Activity, Flag, Calendar, X, Shield, EyeOff, Check, ChevronDown
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import { adminPressReleaseService } from "@/lib/api/admin/press-releases";
import DistributionStatusModal from "@/components/user/DistributionStatusModal";
import Pagination from "@/components/ui/Pagination";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import VisibilityModal from "@/components/admin/VisibilityModal";
import { adminCampaignService } from "@/lib/api/admin/campaigns";

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
    const [visibilityModal, setVisibilityModal] = useState({
        show: false,
        campaignId: null,
        currentOverride: null,
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

    const sourceOptions = [
        { value: "all", label: "All Sources" },
        { value: "record_audio", label: "Audio Record" },
        { value: "record_video", label: "Video Record" },
        { value: "document_upload", label: "Document" },
        { value: "social_link", label: "Social Link" },
        { value: "upload", label: "Video Upload" }
    ];

    const loadReleases = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                search,
                status: statusFilter !== "all" ? statusFilter : undefined,
                visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
                source: sourceFilter !== "all" ? sourceFilter : undefined,
                fromDate: fromDateFilter || undefined,
                toDate: toDateFilter || undefined
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
        [statusFilter, visibilityFilter, sourceFilter, fromDateFilter, toDateFilter]
    );

    useEffect(() => {
        loadReleases(currentPage, searchTerm);
    }, [currentPage, statusFilter, visibilityFilter, sourceFilter, fromDateFilter, toDateFilter]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setVisibilityFilter("all");
        setSourceFilter("all");
        setFromDateFilter("");
        setToDateFilter("");
        setSearchTerm("");
        setCurrentPage(1);
    };

    const getStatusStyle = (status, release) => {
        if (release.distributionStatus?.needsReview) return "bg-rose-50 text-rose-700 border-rose-200";
        if (release.distributionStatus?.isPending) return "bg-amber-50 text-amber-700 border-amber-200";

        switch (status) {
            case "completed":
            case "published": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "submitted_successfully": return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "pending": return "bg-blue-50 text-blue-700 border-blue-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getStatusLabel = (release) => {
        if (release.distributionStatus?.needsReview) return "FLAGGED / REVIEW";
        if (release.distributionStatus?.isPending) return "IN PROGRESS";
        if (release.status === "completed" || release.status === "published" || (!release.distributionStatus?.isPending && release.distributionStatus?.total > 0)) return "COMPLETED";
        return release.status.toUpperCase();
    };

    const handleUpdateVisibility = async (newOverride) => {
        try {
            const res = await adminCampaignService.updateAdminVisibility(visibilityModal.campaignId, newOverride);
            if (res.success) {
                setReleases(prev => prev.map(r =>
                    r.campaign?._id === visibilityModal.campaignId
                        ? { ...r, campaign: { ...r.campaign, visibility: { ...r.campaign.visibility, adminOverride: newOverride } } }
                        : r
                ));
                toast.success("Admin visibility override updated");
                setVisibilityModal({ show: false, campaignId: null, currentOverride: null });
            }
        } catch (error) {
            console.error("Error updating admin visibility:", error);
            toast.error("Failed to update visibility");
        }
    };

    const hasActiveFilters = statusFilter !== "all" || visibilityFilter !== "all" || sourceFilter !== "all" || fromDateFilter !== "" || toDateFilter !== "" || searchTerm !== "";

    return (
        <div className="w-full">
            {/* Page Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Press Release Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 md:mt-2">
                    Oversee, monitor status, and configure distribution visibility overrides for all users' campaigns.
                </p>
            </div>

            {/* Premium Unified Filter & Search Panel */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 mb-6">
                {/* Row 1: Search & Date */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="relative group flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search headline, creator, or email..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl w-full shadow-inner focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium text-xs md:text-sm text-gray-900"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">From:</label>
                        <input
                            type="date"
                            value={fromDateFilter}
                            onChange={(e) => {
                                setFromDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full sm:w-36 p-2 outline-none transition-all cursor-pointer hover:border-primary/40 text-center"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">To:</label>
                        <input
                            type="date"
                            value={toDateFilter}
                            onChange={(e) => {
                                setToDateFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full sm:w-36 p-2 outline-none transition-all cursor-pointer hover:border-primary/40 text-center"
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-50" />

                {/* Row 2: Status & Visibility Filter Badges */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1 block sm:inline">Status:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {[
                                { id: "all", label: "All Press Releases" },
                                { id: "in-progress", label: "In Progress", color: "amber" },
                                { id: "completed", label: "Completed", color: "emerald" },
                                { id: "pending", label: "Queued", color: "blue" }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setStatusFilter(f.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${statusFilter === f.id
                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                        : "bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {f.id !== "all" && (
                                        <div className={`w-1.5 h-1.5 rounded-full bg-${f.color}-500 shadow-[0_0_6px_rgba(0,0,0,0.1)]`} />
                                    )}
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1 block sm:inline">Visibility:</span>
                            {[
                                { id: "all", label: "All" },
                                { id: "user_preference", label: "User Pref" },
                                { id: "force_show", label: "Force Show" },
                                { id: "force_hide", label: "Force Hide" }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setVisibilityFilter(f.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${visibilityFilter === f.id
                                        ? "bg-primary/10 text-primary border-primary/20 font-black"
                                        : "bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 ml-0 lg:ml-2 border-l border-gray-100 pl-0 lg:pl-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1 block sm:inline">Source:</span>
                            <div className="relative w-full sm:w-auto">
                                <button
                                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                                    className="flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-36 p-1.5 px-3 outline-none transition-all hover:border-primary/40 group h-[28px]"
                                >
                                    <span className="truncate">
                                        {sourceOptions.find(opt => opt.value === sourceFilter)?.label}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isSourceDropdownOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-50" 
                                                onClick={() => setIsSourceDropdownOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-0 top-full mt-2 w-full sm:w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5 animate-in"
                                            >
                                                {sourceOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => {
                                                            setSourceFilter(option.value);
                                                            setIsSourceDropdownOpen(false);
                                                            setCurrentPage(1);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                            sourceFilter === option.value 
                                                                ? "bg-primary text-white" 
                                                                : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                                                        }`}
                                                    >
                                                        {option.label}
                                                        {sourceFilter === option.value && (
                                                            <Check className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer ml-auto lg:ml-2 border border-transparent hover:border-red-100"
                            >
                                <X className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Page Results Summary */}
            <div className="flex items-center justify-between mb-4 px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Showing {releases.length} of {totalResults} Releases</span>
            </div>

            {/* Main Content Area */}
            {loading && releases.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading press releases...</p>
                </div>
            ) : releases.length === 0 ? (
                <div className="text-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 shadow-sm px-4">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="p-4 sm:p-5 bg-gray-50 rounded-full">
                            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                        </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 tracking-tight">No Press Releases Found</h3>
                    <p className="text-xs text-gray-500 mb-6 max-w-xs sm:max-w-sm mx-auto font-medium">
                        {hasActiveFilters
                            ? "No results match your active search and filter parameters."
                            : "There are no press releases submitted yet in the system."}
                    </p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-800 transition-all cursor-pointer">
                            Clear Active Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {releases.map((release, index) => (
                            <motion.div
                                key={release._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Responsive Thumbnail / Thumbnail Fallback */}
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 flex items-center justify-center">
                                        {(release.campaign?.productCard?.thumbnail || release.campaign?.videoThumbnail) ? (
                                            <img
                                                src={release.campaign.productCard?.thumbnail || release.campaign.videoThumbnail}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
                                                <FileText className="w-6 h-6 text-blue-200" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="space-y-1">
                                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                                {release.campaign?.article?.headline || "Untitled Press Release"}
                                            </h3>

                                            {/* Adaptive User Detail Badge Line */}
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] md:text-xs text-gray-500 font-bold italic">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                    <span className="truncate max-w-[100px] sm:max-w-[180px]">{release.user?.name || "Anonymous User"}</span>
                                                </div>
                                                <span className="text-gray-300">•</span>
                                                <span className="truncate max-w-[120px] sm:max-w-[220px] text-gray-400 font-medium">{release.user?.email}</span>
                                                {release.user?._id && (
                                                    <Link
                                                        href={`/admin/users/${release.user._id}/press-releases`}
                                                        className="text-primary hover:text-blue-700 transition-colors inline-flex items-center ml-1 p-0.5"
                                                        title="View user press releases"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dynamic Badges Line */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 font-black uppercase tracking-widest text-[8px] sm:text-[9px]">
                                            <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[9px] sm:text-[11px] leading-none px-2.5 py-1 h-[22px] sm:h-[26px] whitespace-nowrap text-blue-600 bg-blue-50/50 rounded-full border border-blue-100/50">
                                                {release.plan?.name || "Standard Plan"}
                                            </span>
                                            {release.distributionStatus?.publishedDate ? (
                                                <span className="flex items-center gap-1 font-bold text-[9px] sm:text-[11px] leading-none px-2.5 py-1 h-[22px] sm:h-[26px] whitespace-nowrap text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100">
                                                    <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    Live: {new Date(release.distributionStatus.publishedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 font-bold text-[9px] sm:text-[11px] leading-none px-2.5 py-1 h-[22px] sm:h-[26px] whitespace-nowrap text-gray-500 bg-gray-50 rounded-full border border-gray-200">
                                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    Created: {new Date(release.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                                </span>
                                            )}
                                            {release.campaign?._id && (
                                                <span className="flex items-center gap-1 font-mono text-[8px] sm:text-[9px] leading-none px-2.5 py-1 h-[22px] sm:h-[26px] whitespace-nowrap text-gray-400 bg-gray-50 rounded-full border border-gray-100" title="Publish GUID">
                                                    ID: {release.campaign._id}
                                                </span>
                                            )}
                                            {release.distributionStatus?.total > 0 && (
                                                <span className="flex items-center gap-1 font-bold text-[9px] sm:text-[11px] leading-none px-2.5 py-1 h-[22px] sm:h-[26px] whitespace-nowrap text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100">
                                                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    {release.distributionStatus.published !== undefined ? release.distributionStatus.published : Math.max(0, release.distributionStatus.total - (release.distributionStatus.pending || 0))} Published
                                                </span>
                                            )}
                                            {release.campaign && (
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold ${release.campaign.visibility?.adminOverride === true ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    release.campaign.visibility?.adminOverride === false ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        release.campaign.visibility?.userPreference === false ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {release.campaign.visibility?.adminOverride === true ? (
                                                        <><Eye className="w-2.5 h-2.5" /> Visibility: Force Show</>
                                                    ) : release.campaign.visibility?.adminOverride === false ? (
                                                        <><EyeOff className="w-2.5 h-2.5" /> Visibility: Force Hide</>
                                                    ) : release.campaign.visibility?.userPreference === false ? (
                                                        <><EyeOff className="w-2.5 h-2.5" /> Visibility: User Hidden</>
                                                    ) : (
                                                        <><Eye className="w-2.5 h-2.5" /> Visibility: User Preference</>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Responsive Status & Action Control Panels */}
                                <div className="flex flex-wrap items-center justify-between xl:justify-end gap-3 pt-3 xl:pt-0 border-t border-gray-50 xl:border-t-0">
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest border transition-all flex items-center gap-1.5 ${getStatusStyle(release.status, release)}`}>
                                        {release.distributionStatus?.needsReview && <Flag className="w-3.5 h-3.5 fill-current" />}
                                        {getStatusLabel(release)}
                                    </span>

                                    <div className="flex flex-wrap items-center bg-gray-50 rounded-xl p-1 gap-1 w-full sm:w-auto justify-between sm:justify-start">
                                        <button
                                            onClick={() => setPreviewModal({ show: true, campaign: release.campaign })}
                                            className="px-2.5 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-blue-600 flex items-center gap-1.5 flex-1 sm:flex-none justify-center cursor-pointer"
                                            title="Preview Article"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-tight">Preview</span>
                                        </button>

                                        <button
                                            onClick={() => setStatusModal({ show: true, campaignId: release.campaign?._id, title: release.campaign?.article?.headline, packageName: release.plan?.name })}
                                            className="px-2.5 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-blue-600 hover:text-blue-700 flex items-center gap-1.5 flex-1 sm:flex-none justify-center cursor-pointer"
                                            title="Click to check live publication status"
                                        >
                                            <Activity className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-tight">Check Status</span>
                                        </button>

                                        {release.campaign && (
                                            <button
                                                onClick={() => setVisibilityModal({ show: true, campaignId: release.campaign._id, currentOverride: release.campaign.visibility?.adminOverride ?? null })}
                                                className="px-2.5 py-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 hover:text-gray-900 flex items-center gap-1.5 border-l border-gray-200 ml-1 pl-2.5 flex-1 sm:flex-none justify-center cursor-pointer"
                                                title="Override visibility in Newsroom"
                                            >
                                                <Shield className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-tight">Visibility</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="pt-4 flex justify-center sm:justify-between items-center flex-wrap gap-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalResults={totalResults}
                            itemsPerPage={10}
                            className="mt-0"
                        />
                    </div>
                </div>
            )}

            {/* Modals Container */}
            <FullArticlePreview
                isOpen={previewModal.show}
                onClose={() => setPreviewModal({ show: false, campaign: null })}
                campaign={previewModal.campaign}
                article={previewModal.campaign?.article}
                productCard={previewModal.campaign?.productCard}
            />

            <DistributionStatusModal
                isOpen={statusModal.show}
                onClose={() => setStatusModal({ show: false, campaignId: null, title: "", packageName: "" })}
                campaignId={statusModal.campaignId}
                title={statusModal.title}
                packageName={statusModal.packageName}
                isAdmin={true}
                onStatusUpdate={(newStatus) => {
                    setReleases(prev => prev.map(r =>
                        r.campaign?._id === statusModal.campaignId
                            ? { ...r, distributionStatus: newStatus }
                            : r
                    ));
                }}
            />

            <VisibilityModal
                isOpen={visibilityModal.show}
                onClose={() => setVisibilityModal({ show: false, campaignId: null, currentOverride: null })}
                onUpdate={handleUpdateVisibility}
                currentOverride={visibilityModal.currentOverride}
            />
        </div>
    );
}
