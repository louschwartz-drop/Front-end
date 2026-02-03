"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function CampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        campaignId: null,
    });
    const [transcriptModal, setTranscriptModal] = useState({
        show: false,
        text: "",
        title: "",
    });

    useEffect(() => {
        fetchCampaigns();

        // Poll for active campaigns every 3 seconds
        const pollInterval = setInterval(() => {
            fetchCampaigns(true); // Silent refresh
        }, 3000);

        return () => clearInterval(pollInterval);
    }, []);

    const fetchCampaigns = async (silent = false) => {
        try {
            const { default: userAuthStore } = await import("@/store/userAuthStore");
            const user = userAuthStore.getState().user;

            if (!user) {
                router.push("/login");
                return;
            }

            const userId = user._id || user.id;

            const { campaignService } = await import("@/lib/api/user/campaigns");
            const response = await campaignService.getUserCampaigns(userId);

            if (response.success) {
                setCampaigns(response.data);
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            uploading: { color: "bg-blue-500", label: "Uploading" },
            uploaded: { color: "bg-blue-500", label: "Uploaded" },
            transcribing: { color: "bg-yellow-500", label: "Transcribing" },
            generating: { color: "bg-purple-500", label: "Generating" },
            finished: { color: "bg-green-500", label: "Finished" },
            failed: { color: "bg-red-500", label: "Failed" },
        };

        const config = statusConfig[status] || statusConfig.uploading;

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    const filteredCampaigns = campaigns.filter((campaign) => {
        if (filter === "all") return true;
        if (filter === "active")
            return ["uploading", "uploaded", "transcribing", "generating"].includes(
                campaign.status,
            );
        if (filter === "finished") return campaign.status === "finished";
        if (filter === "failed") return campaign.status === "failed";
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-[#0A5CFF] border-t-transparent rounded-full"
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
                        <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
                        <p className="text-gray-600 mt-2">
                            Manage and track your video campaigns
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/user/dashboard/create")}
                        className="px-6 py-3 bg-[#0A5CFF] text-white rounded-lg hover:bg-[#3B82F6] font-semibold shadow-sm"
                    >
                        + Create Campaign
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex gap-2 border-b border-gray-200">
                    {[
                        { key: "all", label: "All" },
                        { key: "active", label: "Active" },
                        { key: "finished", label: "Finished" },
                        { key: "failed", label: "Failed" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 font-medium transition-colors ${filter === tab.key
                                ? "text-[#0A5CFF] border-b-2 border-[#0A5CFF]"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Campaigns Table */}
                {filteredCampaigns.length === 0 ? (
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
                            className="mt-6 px-6 py-2 bg-[#0A5CFF] text-white rounded-lg hover:bg-[#3B82F6]"
                        >
                            Create New Campaign
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Headline
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Transcript
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Video URL
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCampaigns.map((campaign) => (
                                        <motion.tr
                                            key={campaign._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(campaign.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    {campaign.article?.headline ? (
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {campaign.article.headline}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">
                                                            No headline yet
                                                        </p>
                                                    )}
                                                    {campaign.errorMessage && (
                                                        <p className="text-xs text-red-600 mt-1">
                                                            {campaign.errorMessage}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    {campaign.rawTranscript ? (
                                                        <>
                                                            <p className="text-sm text-gray-600 line-clamp-3">
                                                                {campaign.rawTranscript}
                                                            </p>
                                                            <button
                                                                onClick={() => handleViewTranscript(campaign)}
                                                                className="text-xs text-[#0A5CFF] hover:underline mt-1"
                                                            >
                                                                View Full
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            Pending...
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {campaign.videoUrl ? (
                                                    <a
                                                        href={campaign.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-[#0A5CFF] hover:underline max-w-xs truncate block"
                                                        title={campaign.videoUrl}
                                                    >
                                                        View Video
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(campaign.createdAt).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    },
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex gap-2 justify-end">
                                                    {campaign.status === "finished" && (
                                                        <button
                                                            onClick={() =>
                                                                router.push(`/user/edit/${campaign._id}`)
                                                            }
                                                            className="px-3 py-1 bg-[#0A5CFF] text-white rounded hover:bg-[#3B82F6]"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    {["uploading", "transcribing", "generating"].includes(
                                                        campaign.status,
                                                    ) && (
                                                            <button
                                                                onClick={() =>
                                                                    router.push(`/user/processing/${campaign._id}`)
                                                                }
                                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            >
                                                                View
                                                            </button>
                                                        )}

                                                    <button
                                                        onClick={() => handleDeleteClick(campaign._id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
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
                                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A5CFF] sm:mt-0 sm:w-auto sm:text-sm"
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
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
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
                                            Delete Campaign
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Are you sure you want to delete this campaign? This
                                                action cannot be undone.
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
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteCancel}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A5CFF] sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
