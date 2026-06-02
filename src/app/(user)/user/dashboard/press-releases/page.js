"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Eye, Link, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, Play, Activity, Clock, Flag, ExternalLink, Globe, File, FileAudio, Video, Mic, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import debounce from "lodash/debounce";
import userAuthStore from "@/store/userAuthStore";
import { pressReleaseService } from "@/lib/api/user/press-releases";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import DistributionStatusModal from "@/components/user/DistributionStatusModal";
import Pagination from "@/components/ui/Pagination";
import VideoModal from "@/components/ui/VideoModal";
import { campaignService } from "@/lib/api/user/campaigns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

export default function UserPressReleasesPage() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [filter, setFilter] = useState("all");
    const [generationType, setGenerationType] = useState("all");
    const [planName, setPlanName] = useState("all");
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
    const [videoModal, setVideoModal] = useState({
        show: false,
        url: "",
    });

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
                search,
                status: filter,
                generationType,
                planName
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
        [userId, filter, generationType, planName]
    );

    useEffect(() => {
        loadReleases(currentPage, searchTerm);
    }, [userId, currentPage, filter, generationType, planName]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleToggleVisibility = async (campaignId, currentPreference) => {
        try {
            // Default is true if undefined, so toggling means false if it was true/undefined
            const newPreference = currentPreference === false ? true : false;
            const res = await campaignService.updateVisibility(campaignId, newPreference);
            if (res.success) {
                setReleases(prev => prev.map(r =>
                    r.campaign?._id === campaignId
                        ? { ...r, campaign: { ...r.campaign, visibility: { ...r.campaign.visibility, userPreference: newPreference } } }
                        : r
                ));
                toast.success(newPreference ? "Press Release is now visible on Drop PR" : "Press Release hidden from Drop PR");
            }
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast.error("Failed to update visibility");
        }
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

    const getSourceDetails = (campaign) => {
        if (!campaign) return null;
        if (campaign.videoSource === "document_upload") return { label: "Doc Uploaded", icon: <FileText className="w-3 h-3" />, color: "text-green-600 bg-green-50 border-green-100" };
        if (campaign.videoSource === "social_link") return { label: "From Social Link", icon: <Link className="w-3 h-3" />, color: "text-blue-600 bg-blue-50 border-blue-100" };
        if (campaign.metadata?.sourceType === "record_audio") return { label: "Audio Record", icon: <Mic className="w-3 h-3" />, color: "text-purple-600 bg-purple-50 border-purple-100" };
        if (campaign.metadata?.sourceType === "record_video") return { label: "Video Record", icon: <Video className="w-3 h-3" />, color: "text-red-600 bg-red-50 border-red-100" };
        return { label: "Upload Video", icon: <UploadCloud className="w-3 h-3" />, color: "text-orange-600 bg-orange-50 border-orange-100" };
    };

    // Removed client-side filter logic since filtering is now server-side.

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Your Press Releases</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and track your published stories.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by headline..."
                        className="pl-10 md:pl-12 pr-4 md:pr-6 py-2 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium text-xs md:text-sm"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 mt-6 items-start xl:items-center">
                <div className="w-full xl:flex-1">
                    <div className="flex flex-row items-center gap-1.5 sm:gap-2 justify-between sm:justify-start w-full">
                        {[
                            { id: "all", label: "All Press Releases" },
                            { id: "in-progress", label: "In Progress" },
                            { id: "finished", label: "Finished" },
                            { id: "pending", label: "Queued" }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => { setFilter(f.id); setCurrentPage(1); }}
                                className={`px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] xs:text-[10px] sm:text-xs font-bold tracking-tight sm:tracking-wide border transition-all flex items-center justify-center whitespace-nowrap flex-1 sm:flex-none ${filter === f.id
                                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-row items-center gap-3 w-full xl:w-auto shrink-0">
                    <div className="w-full sm:w-[180px]">
                        <Select value={generationType} onValueChange={(val) => { setGenerationType(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full bg-white h-[42px] border-gray-200">
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="upload">Upload Video</SelectItem>
                                <SelectItem value="record_audio">Audio Record</SelectItem>
                                <SelectItem value="record_video">Video Record</SelectItem>
                                <SelectItem value="social_link">From Social Link</SelectItem>
                                <SelectItem value="document_upload">Doc Uploaded</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <Select value={planName} onValueChange={(val) => { setPlanName(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full bg-white h-[42px] border-gray-200">
                                <SelectValue placeholder="All Plans" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                <SelectItem value="Boost">Boost</SelectItem>
                                <SelectItem value="Boost +">Boost +</SelectItem>
                                <SelectItem value="Boost Pro">Boost Pro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16 md:py-24 mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
                <div className="space-y-4 md:space-y-6 mt-6">
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                        {releases.map((release, index) => (
                            <motion.div
                                key={release._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-2.5 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 md:gap-4"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-6 w-full">
                                    <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVideoModal({ show: true, url: release.campaign.videoUrl, isAudio: release.campaign.metadata?.sourceType === 'record_audio' });
                                                }}
                                                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                title={release.campaign.metadata?.sourceType === 'record_audio' ? "Listen to Audio" : "View Source Video"}
                                            >
                                                <Play className="w-4 h-4 md:w-6 md:h-6 text-white fill-current" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 truncate group-hover:text-blue-600 transition-colors">
                                            {release.campaign?.article?.headline || "Untitled Press Release"}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-2 text-[10px] md:text-sm">
                                            {release.campaign && getSourceDetails(release.campaign) && (
                                                <span className={`flex items-center gap-1.5 font-bold uppercase tracking-tight text-[8px] md:text-[10px] px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border ${getSourceDetails(release.campaign).color}`}>
                                                    {getSourceDetails(release.campaign).icon}
                                                    {getSourceDetails(release.campaign).label}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 font-bold uppercase tracking-widest text-[8px] md:text-[10px] text-blue-600 bg-blue-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-blue-100">
                                                    {release.plan?.name || "Standard Plan"}
                                                </span>
                                                <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold tracking-widest border flex items-center gap-1.5 ${getStatusStyle(release.status, release)}`}>
                                                    {release.distributionStatus?.needsReview && <Flag className="w-2.5 h-2.5 fill-current" />}
                                                    {getStatusLabel(release)}
                                                </span>
                                                {release.distributionStatus && release.distributionStatus.pending > 0 && (
                                                    <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 font-bold text-[8px] sm:text-[10px]">
                                                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        {release.distributionStatus.pending} Pending
                                                    </span>
                                                )}
                                            </div>
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
                                </div>

                                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 border-t pt-3 w-full">
                                    
                                    {/* Mobile Top Row: News Room Checkbox & Source Button */}
                                    <div className="flex md:hidden items-center justify-between w-full gap-2 px-1 pb-1">
                                        {/* Mobile News Room Checkbox */}
                                        {release.campaign && (
                                            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                                                <input
                                                    type="checkbox"
                                                    checked={release.campaign.visibility?.userPreference !== false}
                                                    onChange={() => handleToggleVisibility(release.campaign._id, release.campaign.visibility?.userPreference)}
                                                    className="w-3.5 h-3.5 rounded-[4px] text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-offset-0 shadow-sm cursor-pointer"
                                                />
                                                <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">Show on News Room</span>
                                            </label>
                                        )}

                                        {release.campaign?.videoUrl ? (
                                            <button
                                                onClick={() => setVideoModal({ show: true, url: release.campaign.videoUrl, isAudio: release.campaign.metadata?.sourceType === 'record_audio' })}
                                                className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-gray-700 flex items-center gap-1.5 border border-gray-200 ml-auto"
                                                title="View Source Link"
                                            >
                                                {release.campaign.metadata?.sourceType === 'record_audio' ? <Mic className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                                                <span className="text-[10px] font-bold whitespace-nowrap">{release.campaign.metadata?.sourceType === 'record_audio' ? 'Listen Audio' : 'Source'}</span>
                                            </button>
                                        ) : <div className="flex-1" />}
                                    </div>

                                    {/* Primary Action Buttons (Mobile Bottom Row / Desktop Flow) */}
                                    <div className="flex items-center gap-2 w-full">
                                        <button
                                            onClick={() => setPreviewModal({ show: true, campaign: release.campaign })}
                                            className="flex-1 md:flex-none justify-center px-2 md:px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-gray-700 hover:text-gray-900 flex items-center gap-1.5 border border-gray-200"
                                            title="Preview Article"
                                        >
                                            <Eye className="w-4 h-4 md:w-4 md:h-4" />
                                            <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">Preview Article</span>
                                        </button>

                                        <button
                                            onClick={() => setStatusModal({ show: true, campaignId: release.campaign._id, title: release.campaign.article?.headline })}
                                            className="flex-1 md:flex-none justify-center px-2 md:px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-blue-600 hover:text-blue-700 flex items-center gap-1.5 border border-blue-100"
                                            title="Click to check live publication status"
                                        >
                                            <Activity className="w-4 h-4 md:w-4 md:h-4" />
                                            <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">Check Live Status</span>
                                        </button>

                                        {/* Desktop-Only Source Button */}
                                        {release.campaign?.videoUrl && (
                                            <button
                                                onClick={() => setVideoModal({ show: true, url: release.campaign.videoUrl, isAudio: release.campaign.metadata?.sourceType === 'record_audio' })}
                                                className="hidden md:flex px-2 md:px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-gray-700 hover:text-gray-900 items-center gap-1.5 border border-gray-200"
                                                title="View Source Link"
                                            >
                                                {release.campaign.metadata?.sourceType === 'record_audio' ? <Mic className="w-4 h-4 md:w-4 md:h-4" /> : <ExternalLink className="w-4 h-4 md:w-4 md:h-4" />}
                                                <span className="text-xs font-bold whitespace-nowrap">{release.campaign.metadata?.sourceType === 'record_audio' ? 'Listen Audio' : 'Source'}</span>
                                            </button>
                                        )}

                                        {/* Desktop-Only News Room Toggle */}
                                        {release.campaign && (
                                            <div className="hidden md:flex items-center ml-auto gap-2">
                                                <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    Show on News Room
                                                </span>
                                                <button
                                                    onClick={() => handleToggleVisibility(release.campaign._id, release.campaign.visibility?.userPreference)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${release.campaign.visibility?.userPreference !== false ? 'bg-primary' : 'bg-gray-300'}`}
                                                    title={release.campaign.visibility?.userPreference !== false ? "Visible on Drop PR Newsroom" : "Hidden from Drop PR Newsroom"}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${release.campaign.visibility?.userPreference !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        )}
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
            {/* Video Modal */}
            <VideoModal
                isOpen={videoModal.show}
                onClose={() => setVideoModal({ show: false, url: "", isAudio: false })}
                videoUrl={videoModal.url}
                isAudio={videoModal.isAudio}
            />
        </div >
    );
}
