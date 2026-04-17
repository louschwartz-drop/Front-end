"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminCampaignService } from "@/lib/api/admin/campaigns";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ArticlePreviewModal from "./ArticlePreviewModal";
import Pagination from "@/components/ui/Pagination";
import VideoModal from "@/components/ui/VideoModal";
import { 
    Play, Eye, AlertCircle, X, FileText, ExternalLink, 
    Check, ChevronDown, Search, Calendar
} from "lucide-react";

export default function AdminCampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState("");
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [selectedError, setSelectedError] = useState("");
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [selectedText, setSelectedText] = useState({ headline: "", body: "" });

    // Filter states
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "finished", label: "Finished" },
        { value: "failed", label: "Failed" },
        { value: "irrelevant", label: "Irrelevant Content" },
        { value: "processing", label: "Processing" }
    ];

    useEffect(() => {
        loadCampaigns();
    }, [pagination.page, statusFilter, dateFilter]);

    // Independent search effects to avoid overlapping with status/date
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadCampaigns();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                status: statusFilter !== "all" ? statusFilter : undefined,
                date: dateFilter || undefined
            };
            const response = await adminCampaignService.getCampaigns(params);
            if (response && response.success) {
                setCampaigns(response.data?.campaigns || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data?.pagination?.total || 0,
                    totalPages: response.data?.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            console.error("Error loading campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setIsModalOpen(true);
    };

    const handleViewVideo = (url) => {
        setSelectedVideoUrl(url);
        setIsVideoModalOpen(true);
    };

    const handleViewError = (error) => {
        setSelectedError(error);
        setIsErrorModalOpen(true);
    };

    const handleViewRawText = (article) => {
        setSelectedText({
            headline: article?.headline || "Generated Text",
            body: article?.body || ""
        });
        setIsTextModalOpen(true);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setDateFilter("");
        setSearchTerm("");
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
                <p className="text-gray-600 mt-2">
                    View and manage all campaigns across the platform
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">

                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className="flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary w-44 p-2 pl-3 outline-none transition-all hover:border-primary/40 group"
                            >
                                <span className="truncate">
                                    {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isStatusDropdownOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-50" 
                                            onClick={() => setIsStatusDropdownOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
                                        >
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setStatusFilter(option.value);
                                                        setIsStatusDropdownOpen(false);
                                                        setPagination(p => ({ ...p, page: 1 }));
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                        statusFilter === option.value 
                                                            ? "bg-primary text-white" 
                                                            : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                                                    }`}
                                                >
                                                    {option.label}
                                                    {statusFilter === option.value && (
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

                    <div className="h-6 w-px bg-gray-100 hidden md:block" />

                    <div className="flex items-center gap-2 px-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setPagination(p => ({ ...p, page: 1 }));
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

            <div className="mb-6 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by client name, email or headline..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm"
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {loading && campaigns.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading campaigns...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">Client Info</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">Status</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500 w-[30%]">Generated Text</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {campaigns.length > 0 ? (
                                    campaigns.map((campaign) => (
                                        <tr key={campaign._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 leading-tight">
                                                        {campaign.userId?.name || "N/A"}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            {campaign.userId?.email || "N/A"}
                                                        </span>
                                                        {campaign.userId?._id && (
                                                            <Link 
                                                                href={`/admin/users/${campaign.userId._id}/campaigns`}
                                                                className="text-gray-400 hover:text-primary transition-colors"
                                                                title="View user campaigns"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-fit">
                                                    <span 
                                                        onClick={() => campaign.status === "failed" && campaign.errorMessage ? handleViewError(campaign.errorMessage) : null}
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none transition-all ${
                                                            campaign.status === "finished" || campaign.status === "published" || campaign.status === "submitted_successfully" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                                            campaign.status === "failed" ? "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 cursor-pointer shadow-sm" :
                                                            "bg-blue-100 text-blue-700 border border-blue-200"
                                                        }`}
                                                    >
                                                        {campaign.errorMessage?.toLowerCase().includes("language") ? "Language Not Supported" : (campaign.errorMessage?.toLowerCase().includes("irrelevant") ? "Irrelevant Content" : campaign.status)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold text-xs">
                                                        {new Date(campaign.createdAt).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {new Date(campaign.createdAt).toLocaleTimeString('en-GB', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {campaign.status !== "failed" && (campaign.article?.headline || campaign.article?.body) ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-500 line-clamp-2 text-xs leading-relaxed">
                                                            {campaign.article?.headline || campaign.article?.body}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleViewRawText(campaign.article)}
                                                            className="text-[10px] text-primary font-bold uppercase tracking-wider underline hover:text-blue-700 w-fit"
                                                        >
                                                            view_more
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic text-xs">Not generated</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {campaign.status !== "failed" && (
                                                        <button
                                                            onClick={() => handleViewCampaign(campaign)}
                                                            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-all group"
                                                            title="Full Article Preview"
                                                        >
                                                            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                    {campaign.videoUrl && (
                                                        <button
                                                            onClick={() => handleViewVideo(campaign.videoUrl)}
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all group"
                                                            title="Watch Source Video"
                                                        >
                                                            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium italic">
                                            No campaigns found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                totalResults={pagination.total}
                itemsPerPage={pagination.limit}
                className="mt-0"
            />

            <ArticlePreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                campaign={selectedCampaign}
            />

            <VideoModal
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                videoUrl={selectedVideoUrl}
            />

            {/* Error Modal */}
            <AnimatePresence>
                {isErrorModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsErrorModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <AlertCircle className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-wider text-sm">Campaign Error</h3>
                                </div>
                                <button 
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 max-h-[40vh] overflow-y-auto">
                                <p className="text-sm text-rose-800 leading-relaxed font-medium">
                                    {selectedError}
                                </p>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Raw Text Content Modal */}
            <AnimatePresence>
                {isTextModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsTextModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3 text-primary">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{selectedText.headline}</h3>
                                </div>
                                <button 
                                    onClick={() => setIsTextModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 max-h-[60vh] overflow-y-auto">
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                        {selectedText.body}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setIsTextModalOpen(false)}
                                    className="px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
