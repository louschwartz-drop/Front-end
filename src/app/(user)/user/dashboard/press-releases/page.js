"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Eye, Link, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, Play, Activity, Clock, Flag } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import debounce from "lodash/debounce";
import userAuthStore from "@/store/userAuthStore";
import { pressReleaseService } from "@/lib/api/user/press-releases";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import DistributionStatusModal from "@/components/user/DistributionStatusModal";

export default function UserPressReleasesPage() {
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState("all"); // all, in-progress, finished, pending

    const { user } = userAuthStore();
    const userId = user?._id || user?.id;

    const loadReleases = async (page = 1, search = "") => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await pressReleaseService.getAll(userId, {
                page,
                limit: 10,
                search
            });

            if (res.success) {
                setReleases(res.data);
                setTotalPages(res.pagination.totalPages);
                setTotalResults(res.pagination.total);
            }
        } catch (error) {
            console.error('Error loading press releases:', error);
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
        [userId]
    );

    useEffect(() => {
        loadReleases(currentPage, searchTerm);
    }, [userId, currentPage]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
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

    const filteredReleases = releases.filter(release => {
        if (filter === "all") return true;
        const label = getStatusLabel(release);
        if (filter === "in-progress") return label === "IN PROGRESS";
        if (filter === "finished") return label === "FINISHED";
        if (filter === "pending") return label === "PENDING" || label === "SUBMITTED_SUCCESSFULLY";
        return true;
    });

    return (
        <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Your Press Releases</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium tracking-tight">Manage and track your published stories.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by article headline..."
                        className="pl-10 md:pl-12 pr-4 md:pr-6 py-2 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium text-xs md:text-sm"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                    { id: "all", label: "All Press Releases" },
                    { id: "in-progress", label: "In Progress", color: "amber" },
                    { id: "finished", label: "Finished", color: "emerald" },
                    { id: "pending", label: "Queued", color: "blue" }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filter === f.id
                            ? "bg-gray-900 text-white border-gray-900 shadow-sm scale-105"
                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                            }`}
                    >
                        {f.id !== "all" && (
                            <div className={`w-2 h-2 rounded-full bg-${f.color}-500 shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                        )}
                        {f.label}
                        <span className={`ml-1 text-[9px] ${filter === f.id ? "text-gray-400" : "text-gray-300"}`}>
                            ({releases.filter(r => {
                                if (f.id === "all") return true;
                                const label = getStatusLabel(r);
                                if (f.id === "in-progress") return label === "IN PROGRESS";
                                if (f.id === "finished") return label === "FINISHED";
                                if (f.id === "pending") return label === "PENDING" || label === "SUBMITTED_SUCCESSFULLY";
                                return true;
                            }).length})
                        </span>
                    </button>
                ))}
            </div>

            {loading && releases.length === 0 ? (
                <div className="flex justify-center py-10 md:py-20">
                    <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary"></div>
                </div>
            ) : releases.length === 0 ? (
                <div className="text-center py-10 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-gray-200 shadow-sm">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <div className="p-4 md:p-6 bg-gray-50 rounded-full">
                            <FileText className="w-8 h-8 md:w-12 md:h-12 text-gray-300" />
                        </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">No Press Releases Found</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 max-w-xs md:max-w-sm mx-auto font-medium px-4">
                        {searchTerm ? "No results match your search criteria." : "Once you purchase a distribution plan, your press releases will appear here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {filteredReleases.map((release, index) => (
                            <motion.div
                                key={release._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-2.5 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6"
                            >
                                <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                    <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
                                        {(release.campaign?.productCard?.thumbnail || release.campaign?.videoThumbnail) ? (
                                            <img
                                                src={release.campaign?.productCard?.thumbnail || release.campaign?.videoThumbnail}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                                <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
                                            </div>
                                        )}
                                        {release.campaign?.videoUrl && (
                                            <a
                                                href={release.campaign.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                                                title="View Source Video"
                                            >
                                                <Play className="w-4 h-4 md:w-6 md:h-6 text-white fill-current" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 truncate group-hover:text-blue-600 transition-colors">
                                            {release.campaign?.article?.headline || "Untitled Press Release"}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 md:gap-y-2 text-[10px] md:text-sm">
                                            <span className="flex items-center gap-1 font-bold uppercase tracking-widest text-[8px] md:text-[10px] text-blue-600 bg-blue-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-blue-100">
                                                {release.plan?.name || "Standard Plan"}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-400 font-semibold">
                                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                {new Date(release.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}
                                            </span>
                                            {release.distributionStatus && release.distributionStatus.total > 0 && (
                                                <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 font-bold text-[8px] sm:text-[10px]">
                                                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    {release.distributionStatus.total} Websites
                                                </span>
                                            )}
                                            {release.distributionStatus && release.distributionStatus.pending > 0 && (
                                                <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 font-bold text-[8px] sm:text-[10px]">
                                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    {release.distributionStatus.pending} Pending
                                                </span>
                                            )}
                                            {release.distributionStatus?.publishedDate && (
                                                <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 font-bold text-[8px] sm:text-[10px]">
                                                    <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                    Live Since: {new Date(release.distributionStatus.publishedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                            {release.distributionStatus?.lastStatusCheck && getStatusLabel(release) !== "FINISHED" && (
                                                <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 font-bold text-[8px] sm:text-[10px]">
                                                    Last Updated: {getRelativeTime(release.distributionStatus.lastStatusCheck)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 border-t md:border-t-0 pt-2.5 md:pt-0">
                                    <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black tracking-widest border mr-1 md:mr-2 flex items-center gap-1.5 ${getStatusStyle(release.status, release)}`}>
                                        {release.distributionStatus?.needsReview && <Flag className="w-3 h-3 fill-current" />}
                                        {getStatusLabel(release)}
                                    </span>

                                    <button
                                        onClick={() => setPreviewModal({ show: true, campaign: release.campaign })}
                                        className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-blue-600 group/btn"
                                        title="Preview Article"
                                    >
                                        <Eye className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>

                                    <button
                                        onClick={() => setStatusModal({ show: true, campaignId: release.campaign._id, title: release.campaign.article?.headline })}
                                        className="p-1.5 md:p-2 hover:bg-blue-50 rounded-lg transition-all text-blue-500 hover:text-blue-700 group/btn flex items-center gap-1"
                                        title="View Distribution Status"
                                    >
                                        <Activity className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>

                                    {release.campaign?.videoUrl && (
                                        <a
                                            href={release.campaign.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-blue-600 group/btn"
                                            title="View Source Video"
                                        >
                                            <Link className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {true && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 md:pt-6 border-t border-gray-100">
                            <p className="text-[10px] md:text-sm text-gray-500 font-medium">
                                Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * 10 + 1}</span> to{" "}
                                <span className="text-gray-900 font-bold">
                                    {Math.min(currentPage * 10, totalResults)}
                                </span>{" "}
                                of <span className="text-gray-900 font-bold">{totalResults}</span> releases
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages}
                                    variant="outline"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

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
        </div >
    );
}
