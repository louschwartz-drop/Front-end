"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Eye, Link, Clock, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, Play, User, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import { adminPressReleaseService } from "@/lib/api/admin/press-releases";
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

    const loadReleases = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const res = await adminPressReleaseService.getAll({
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
        []
    );

    useEffect(() => {
        loadReleases(currentPage, searchTerm);
    }, [currentPage]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "published": return "bg-green-100 text-green-700 border-green-200";
            case "pending": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const handlePublishToSyndicate = (releaseId) => {
        toast.info("Publish to Syndicate functionality is coming soon.");
    };

    return (
        <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Manage Press Releases</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium tracking-tight">Review and syndicate stories from all users.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by headline or user..."
                        className="pl-10 md:pl-12 pr-4 md:pr-6 py-2 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition-all font-medium text-xs md:text-sm"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {loading && releases.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
                    />
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
                        {searchTerm ? "No results match your search criteria." : "There are no press releases submitted yet."}
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
                                className="bg-white p-2.5 md:p-5 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6"
                            >
                                <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                                    <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
                                        {release.campaign?.videoThumbnail ? (
                                            <img
                                                src={release.campaign.videoThumbnail}
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
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 font-semibold italic">
                                                <User className="w-3 h-3" />
                                                {release.user?.name} ({release.user?.email})
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 md:gap-y-2 mt-2">
                                            <span className="flex items-center gap-1 font-bold uppercase tracking-widest text-[8px] md:text-[10px] text-blue-600 bg-blue-50 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-blue-100">
                                                {release.plan?.name || "Standard Plan"}
                                            </span>
                                            <span className="flex items-center gap-1 text-gray-400 font-semibold text-[8px] md:text-[10px]">
                                                <Clock className="w-3 h-3" />
                                                {new Date(release.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                                    <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black tracking-widest border ${getStatusStyle(release.status)}`}>
                                        {release.status.toUpperCase()}
                                    </span>

                                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => setPreviewModal({ show: true, campaign: release.campaign })}
                                            className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold"
                                            title="View Article"
                                        >
                                            <Eye className="w-4 h-4 transition-transform" />
                                            View
                                        </button>

                                        <button
                                            onClick={() => handlePublishToSyndicate(release._id)}
                                            className="p-1.5 md:p-2 bg-blue-600 text-white rounded-lg transition-all hover:bg-black flex items-center gap-1 text-[10px] md:text-[11px] font-black shadow-sm"
                                        >
                                            <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            PUBLISH TO SYNDICATE
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {(currentPage - 1) * 10 + 1} to{" "}
                                {Math.min(currentPage * 10, totalResults)}{" "}
                                of {totalResults} releases
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
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
        </div>
    );
}
