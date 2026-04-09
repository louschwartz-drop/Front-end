"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { campaignService } from "@/lib/api/user/campaigns";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import PreviewPublishModal from "@/components/user/PreviewPublishModal";
import FullArticlePreview from "@/components/user/FullArticlePreview";
import userAuthStore from "@/store/userAuthStore";
import Button from "@/components/ui/Button";
import { useSocket } from "@/context/SocketContext";

const VideoModal = dynamic(() => import("@/components/ui/VideoModal"), { ssr: false });

export default function CampaignsPage() {
    const router = useRouter();
    const socket = useSocket();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [videoModal, setVideoModal] = useState({
        show: false,
        url: "",
    });
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        campaignId: null,
    });
    const [transcriptModal, setTranscriptModal] = useState({
        show: false,
        text: "",
        title: "",
    });
    const [previewModal, setPreviewModal] = useState({
        show: false,
        campaign: null,
    });
    const [fullPreview, setFullPreview] = useState({
        show: false,
        campaign: null,
    });
    const [errorModal, setErrorModal] = useState({
        show: false,
        text: "",
        title: "",
    });

    const { user } = userAuthStore();

    useEffect(() => {
        // Listen for real-time updates via Socket
        if (socket) {
            socket.on("campaign_updated", (data) => {
                console.log("🔄 Campaigns List updated via socket:", data);
                fetchCampaigns(true); // Silent refresh
            });

            return () => {
                socket.off("campaign_updated");
            };
        }
    }, [socket]);
    
    // Original effect for initial load and filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCampaigns();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentPage, filter]);

    const fetchCampaigns = async (silent = false) => {
        try {
            const userState = userAuthStore.getState().user;

            if (!userState) {
                router.push("/");
                return;
            }

            const userId = userState._id || userState.id;

            const { campaignService } = await import("@/lib/api/user/campaigns");
            const response = await campaignService.getUserCampaigns({
                userId,
                page: currentPage,
                limit: 12,
                search: searchTerm,
                status: filter
            });

            if (response.success) {
                setCampaigns(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalResults(response.pagination.total);
                }
            }
        } catch (error) {
            if (!silent) {
                console.error("Error fetching campaigns:", error);
                toast.error("Failed to load campaigns");
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleDeleteClick = (campaignId) => {
        setDeleteModal({ show: true, campaignId });
    };

    const handleDeleteConfirm = async () => {
        const campaignId = deleteModal.campaignId;
        setDeleteModal({ show: false, campaignId: null });

        try {
            const { campaignService } = await import("@/lib/api/user/campaigns");
            const response = await campaignService.deleteCampaign(campaignId);

            if (response.success) {
                toast.success("Campaign deleted successfully");
                fetchCampaigns();
            } else {
                toast.error(response.message || "Failed to delete campaign");
            }
        } catch (error) {
            console.error("Error deleting campaign:", error);
            toast.error("Failed to delete campaign");
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ show: false, campaignId: null });
    };

    const handleViewTranscript = (campaign) => {
        setTranscriptModal({
            show: true,
            text: campaign.rawTranscript || "No transcript available yet.",
            title: campaign.article?.headline || "Campaign Transcript",
        });
    };

    const closeTranscriptModal = () => {
        setTranscriptModal({ show: false, text: "", title: "" });
    };

    const handleViewError = (campaign) => {
        setErrorModal({
            show: true,
            text: campaign.errorMessage || "No error details available.",
            title: campaign.article?.headline || "Campaign Error Details",
        });
    };

    const closeErrorModal = () => {
        setErrorModal({ show: false, text: "", title: "" });
    };

    const getStatusBadge = (campaign) => {
        const status = campaign.status;
        const isIrrelevant = campaign.errorMessage?.toLowerCase().includes("irrelevant");
        const isLanguageError = campaign.errorMessage?.toLowerCase().includes("language");
        
        const statusConfig = {
            uploading: { color: "bg-blue-500", label: "Uploading", mobileLabel: "Uploading" },
            uploaded: { color: "bg-blue-500", label: "Uploaded", mobileLabel: "Uploaded" },
            transcribing: { color: "bg-yellow-500", label: "Transcribing", mobileLabel: "Trans" },
            generating: { color: "bg-purple-500", label: "Generating", mobileLabel: "Gen" },
            finished: { color: "bg-green-500", label: "Ready for Publish", mobileLabel: "Ready" },
            published: { color: "bg-green-600", label: "Published", mobileLabel: "Pub" },
            submitted_successfully: { color: "bg-green-600", label: "Submitted Successfully", mobileLabel: "Success" },
            failed: { 
                color: "bg-red-500", 
                label: isLanguageError ? "Language Not Supported" : (isIrrelevant ? "Content Irrelevant" : "Failed"),
                mobileLabel: "Failed"
            },
        };

        const config = statusConfig[status] || statusConfig.uploading;

        return (
            <span
                className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold text-white shadow-sm ${config.color}`}
            >
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.mobileLabel}</span>
            </span>
        );
    };

    const handlePublish = async (campaignId) => {
        // Refresh user data first to ensure we have latest credit count
        await userAuthStore.getState().refreshUser();

        const currentUser = userAuthStore.getState().user;
        const hasCredits = (currentUser?.planCredits || []).some(pc => pc.remainingArticles > 0);

        console.log('Publish Clicked:', {
            campaignId,
            hasCredits,
            user: currentUser
        });

        // Check if user has available releases
        const campaign = campaigns.find(c => c._id === campaignId);

        if (!hasCredits) {
            toast.info("No releases available. You can purchase a plan from the publish preview window.");
        }

        setPreviewModal({ show: true, campaign });
    };

    const handlePublishConfirm = async (planId = null) => {
        try {
            const { pressReleaseService } = await import("@/lib/api/user/press-releases");
            const response = await pressReleaseService.publish(previewModal.campaign._id, planId);

            if (response.success) {
                toast.success(response.message || "Published successfully!");
                // Update local user store to reflect consumed credit
                await userAuthStore.getState().refreshUser();
                setPreviewModal({ show: false, campaign: null });
                fetchCampaigns();
            } else {
                toast.error(response.message || "Failed to publish");
            }
        } catch (error) {
            console.error("Publish error:", error);
            toast.error("Failed to publish campaign");
            throw error;
        }
    };

    const displayedCampaigns = campaigns;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Campaigns</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Manage and track your video campaigns
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/user/dashboard/create")}
                        className="md:px-6 md:py-3 px-2.5 py-1.5 bg-primary text-white rounded-lg hover:bg-brand-blue text-[10px] xs:text-xs md:text-base font-semibold shadow-sm shrink-0 whitespace-nowrap"
                    >
                        + Create Campaign
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns by headline..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    <div className="flex gap-1 md:gap-2 border-b border-gray-200">
                        {[
                            { key: "all", label: "All", mobileLabel: "All" },
                            { key: "active", label: "Active", mobileLabel: "Active" },
                            { key: "finished", label: "Ready for Publish", mobileLabel: "Ready" },
                            { key: "published", label: "Published", mobileLabel: "Pub" },
                            { key: "failed", label: "Failed", mobileLabel: "Failed" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setFilter(tab.key);
                                    setCurrentPage(1);
                                }}
                                className={` px-1 md:px-4 py-2 font-medium transition-colors ${filter === tab.key
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden text-xs">{tab.mobileLabel}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campaigns Cards */}
                {displayedCampaigns.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            No campaigns found
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Get started by creating your first campaign
                        </p>
                        <button
                            onClick={() => router.push("/user/dashboard/create")}
                            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-brand-blue"
                        >
                            Create New Campaign
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedCampaigns.map((campaign) => (
                            <motion.div
                                key={campaign._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        {getStatusBadge(campaign)}
                                        <span className="text-xs text-gray-500">
                                            {new Date(campaign.createdAt).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                },
                                            )}
                                        </span>
                                    </div>

                                    {/* Headline */}
                                    <div className="mb-2">
                                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                            Headline
                                        </h3>
                                        {campaign.article?.headline ? (
                                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                {campaign.article.headline}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">
                                                No headline yet
                                            </p>
                                        )}
                                    </div>

                                    {/* Error Message */}
                                    {campaign.errorMessage && (
                                        <div className="mt-2 bg-red-50 p-2 rounded border border-red-100 flex items-start justify-between gap-2 overflow-hidden">
                                            <p className="text-[10px] text-red-600 leading-tight font-medium" title={campaign.errorMessage.length > 100 ? campaign.errorMessage : ""}>
                                                <span className="font-bold uppercase mr-1">Error:</span>
                                                {campaign.errorMessage.length > 80 
                                                    ? `${campaign.errorMessage.substring(0, 80)}...` 
                                                    : campaign.errorMessage}
                                            </p>
                                            <button 
                                                onClick={() => handleViewError(campaign)}
                                                className="shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                title="View Full Error"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="p-5 space-y-4">
                                    {/* Transcript */}
                                    <div>
                                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                            Transcript
                                        </h4>
                                        {campaign.rawTranscript ? (
                                            <div>
                                                <p className="text-sm text-gray-600 line-clamp-3 mb-1">
                                                    {campaign.rawTranscript}
                                                </p>
                                                <button
                                                    onClick={() => handleViewTranscript(campaign)}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    View Full Transcript
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">
                                                Pending...
                                            </span>
                                        )}
                                    </div>

                                    {/* Video URL */}
                                    <div>
                                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                            Video
                                        </h4>
                                        {campaign.videoUrl ? (
                                            <button
                                                onClick={() => setVideoModal({ show: true, url: campaign.videoUrl })}
                                                className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                View Video
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">No video available</span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer - Actions */}
                                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.status === "finished" && (
                                            <button
                                                onClick={() =>
                                                    router.push(`/user/edit/${campaign._id}`)
                                                }
                                                className="flex-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-brand-blue transition-colors"
                                            >
                                                Publish Now
                                            </button>
                                        )}

                                        {(campaign.status === "published" || campaign.status === "submitted_successfully") && (
                                            <button
                                                onClick={() =>
                                                    setFullPreview({ show: true, campaign })
                                                }
                                                className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
                                            >
                                                Preview Article
                                            </button>
                                        )}

                                        {["uploading", "transcribing", "generating"].includes(
                                            campaign.status,
                                        ) && (
                                                <button
                                                    onClick={() =>
                                                        router.push(`/user/processing/${campaign._id}`)
                                                    }
                                                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    View
                                                </button>
                                            )}

                                        {(campaign.status !== "published" && campaign.status !== "submitted_successfully") && (
                                            <button
                                                onClick={() => handleDeleteClick(campaign._id)}
                                                className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors"
                                            >
                                                {["uploading", "transcribing", "generating"].includes(campaign.status) ? "Cancel" : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {displayedCampaigns.length > 0 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-8">
                        <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * 12 + 1}</span> to{" "}
                            <span className="text-gray-900 font-bold">
                                {Math.min(currentPage * 12, totalResults)}
                            </span>{" "}
                            of <span className="text-gray-900 font-bold">{totalResults}</span> campaigns
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => {
                                    setCurrentPage((prev) => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                variant="outline"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => {
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                variant="outline"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Transcript Modal */}
            <AnimatePresence>
                {transcriptModal.show && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 transition-opacity bg-black opacity-30"
                                onClick={closeTranscriptModal}
                            />

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                                &#8203;
                            </span>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6"
                            >
                                <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                        type="button"
                                        onClick={closeTranscriptModal}
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Transcript: {transcriptModal.title}
                                        </h3>
                                        <div className="mt-2 max-h-[60vh] overflow-y-auto bg-gray-50 p-4 rounded-md">
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                {transcriptModal.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={closeTranscriptModal}
                                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            {/* Background overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 transition-opacity backdrop-blur-md bg-black/20"
                                onClick={handleDeleteCancel}
                            />

                            {/* Modal panel */}
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                                &#8203;
                            </span>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                            >
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg
                                            className="h-6 w-6 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            {campaigns.find(c => c._id === deleteModal.campaignId)?.status && 
                                             ["uploading", "transcribing", "generating"].includes(campaigns.find(c => c._id === deleteModal.campaignId)?.status) 
                                             ? "Cancel Analysis" : "Delete Campaign"}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {campaigns.find(c => c._id === deleteModal.campaignId)?.status && 
                                                 ["uploading", "transcribing", "generating"].includes(campaigns.find(c => c._id === deleteModal.campaignId)?.status) 
                                                 ? "Are you sure you want to cancel this analysis? This will stop all background processing and remove the campaign."
                                                 : "Are you sure you want to delete this campaign? This action cannot be undone."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleDeleteConfirm}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {campaigns.find(c => c._id === deleteModal.campaignId)?.status && 
                                         ["uploading", "transcribing", "generating"].includes(campaigns.find(c => c._id === deleteModal.campaignId)?.status) 
                                         ? "Cancel & Delete" : "Delete"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteCancel}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Preview Publish Modal (For publishing flow) */}
            <PreviewPublishModal
                isOpen={previewModal.show}
                onClose={() => setPreviewModal({ show: false, campaign: null })}
                campaign={previewModal.campaign}
                article={previewModal.campaign?.article}
                onPublish={handlePublishConfirm}
            />

            {/* Full Article Preview (For viewing published articles) */}
            <FullArticlePreview
                isOpen={fullPreview.show}
                onClose={() => setFullPreview({ show: false, campaign: null })}
                campaign={fullPreview.campaign}
                article={fullPreview.campaign?.article}
                productCard={fullPreview.campaign?.productCard}
            />

            {/* Error Detail Modal */}
            <AnimatePresence>
                {errorModal.show && (
                    <div className="fixed inset-0 z-[60] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 transition-opacity bg-black/40 backdrop-blur-sm"
                                onClick={closeErrorModal}
                            />

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                                &#8203;
                            </span>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative z-[70] inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-red-100"
                            >
                                <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                        type="button"
                                        onClick={closeErrorModal}
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900 mb-1">
                                            Campaign Error Details
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4 truncate italic">
                                            {errorModal.title}
                                        </p>
                                        <div className="mt-2 max-h-[40vh] overflow-y-auto bg-red-50 p-4 rounded-lg border border-red-100">
                                            <p className="text-sm text-red-700 font-medium whitespace-pre-wrap leading-relaxed">
                                                {errorModal.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={closeErrorModal}
                                        className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-red-600 text-base font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm transition-all"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Inline Video Viewer */}
            <VideoModal
                isOpen={videoModal.show}
                onClose={() => setVideoModal({ show: false, url: "" })}
                videoUrl={videoModal.url}
            />
        </>
    );
}
