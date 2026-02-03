"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminUserService } from "@/lib/api/admin/users";
import { toast } from "react-toastify";
import Link from "next/link";
import ArticlePreviewModal from "../../../campaigns/ArticlePreviewModal";

export default function UserCampaignsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserCampaigns();
        }
    }, [userId]);

    const fetchUserCampaigns = async () => {
        try {
            setLoading(true);
            const response = await adminUserService.getUserCampaigns(userId);
            if (response && response.success) {
                setCampaigns(response.data);
            }
        } catch (error) {
            console.error("Error fetching user campaigns:", error);
            toast.error("Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    };

    const handleViewCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setIsModalOpen(true);
    };

    return (
        <div className="mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-4"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Users
                </button>
                <h1 className="text-3xl font-bold text-gray-900">User Campaigns</h1>
                <p className="text-gray-600 mt-2">
                    Viewing all campaigns for this user
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading campaigns...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Client Name</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Source Link</th>
                                    <th className="px-6 py-4 font-semibold">Generated Text</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {campaigns.length > 0 ? (
                                    campaigns.map((campaign) => (
                                        <tr key={campaign._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {campaign.userId?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {campaign.userId?.email || "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {campaign.videoUrl ? (
                                                    <a
                                                        href={campaign.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-brand-blue hover:underline"
                                                    >
                                                        View Video
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">Local Upload</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-500 line-clamp-1 max-w-xs">
                                                    {campaign.article?.headline || campaign.article?.body || "No text generated"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewCampaign(campaign)}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-brand-blue bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No campaigns found for this user
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ArticlePreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                campaign={selectedCampaign}
            />
        </div>
    );
}
