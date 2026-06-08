"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminCampaignService } from "@/lib/api/admin/campaigns";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FullArticlePreview from "@/components/user/FullArticlePreview";
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
    const [sourceFilter, setSourceFilter] = useState("all");
    const [fromDateFilter, setFromDateFilter] = useState("");
    const [toDateFilter, setToDateFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "active", label: "Active" },
        { value: "finished", label: "Finished" },
        { value: "published", label: "Published" },
        { value: "failed", label: "Failed" }
    ];

    const sourceOptions = [
        { value: "all", label: "All Sources" },
        { value: "record_audio", label: "Audio Record" },
        { value: "record_video", label: "Video Record" },
        { value: "document_upload", label: "Document" },
        { value: "social_link", label: "Social Link" },
        { value: "upload", label: "Video Upload" }
    ];

    useEffect(() => {
        loadCampaigns();
    }, [pagination.page, statusFilter, sourceFilter, fromDateFilter, toDateFilter]);

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
                source: sourceFilter !== "all" ? sourceFilter : undefined,
                fromDate: fromDateFilter || undefined,
                toDate: toDateFilter || undefined
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

    const handleViewRawText = (campaign) => {
        const article = campaign?.article;
        setSelectedText({
            headline: article?.headline || "Generated Text",
            body: campaign?.rawTranscript || article?.body || ""
        });
        setIsTextModalOpen(true);
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setSourceFilter("all");
        setFromDateFilter("");
        setToDateFilter("");
        setSearchTerm("");
        setPagination(p => ({ ...p, page: 1 }));
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Campaign Management</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1.5">
                    View and manage all campaigns across the platform
                </p>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                {/* Search Bar */}
                <div className="relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors z-10" />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by client name, email or headline..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm text-gray-900"
                    />
                </div>

                {/* Status & Date Filters Grid */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                        {/* Status Select */}
                        <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Status</label>
                            <div className="relative w-full sm:w-auto">
                                <button
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    className="flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-44 p-2.5 pl-3 outline-none transition-all hover:border-primary/40 group"
                                >
                                    <span className="truncate">
                                        {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
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
                                                className="absolute left-0 top-full mt-2 w-full sm:w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5 animate-in"
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

                        {/* Source Select */}
                        <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Source</label>
                            <div className="relative w-full sm:w-auto">
                                <button
                                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                                    className="flex items-center justify-between bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-40 p-2.5 pl-3 outline-none transition-all hover:border-primary/40 group"
                                >
                                    <span className="truncate">
                                        {sourceOptions.find(opt => opt.value === sourceFilter)?.label}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
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
                                                            setPagination(p => ({ ...p, page: 1 }));
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

                        <div className="h-6 w-px bg-gray-150 hidden sm:block" />

                        {/* Date Pickers */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">From</label>
                                <input 
                                    type="date"
                                    value={fromDateFilter}
                                    onChange={(e) => {
                                        setFromDateFilter(e.target.value);
                                        setPagination(p => ({ ...p, page: 1 }));
                                    }}
                                    className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full sm:w-36 p-2.5 outline-none transition-all cursor-pointer hover:border-primary/40 text-center"
                                />
                            </div>
                            <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">To</label>
                                <input 
                                    type="date"
                                    value={toDateFilter}
                                    onChange={(e) => {
                                        setToDateFilter(e.target.value);
                                        setPagination(p => ({ ...p, page: 1 }));
                                    }}
                                    className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-full sm:w-36 p-2.5 outline-none transition-all cursor-pointer hover:border-primary/40 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {(statusFilter !== "all" || sourceFilter !== "all" || fromDateFilter !== "" || toDateFilter !== "" || searchTerm !== "") && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all w-full lg:w-auto mt-1 lg:mt-0 border border-transparent hover:border-red-100"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Content Table / Grid Area */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {loading && campaigns.length === 0 ? (
                    <div className="p-16 sm:p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium text-sm sm:text-base">Loading campaigns...</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View (visible on md and up) */}
                        <div className="hidden md:block overflow-x-auto">
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
                                <tbody className="divide-y divide-gray-200">
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
                                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border transition-all ${
                                                                campaign.status === "finished" || campaign.status === "published" || campaign.status === "submitted_successfully" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                campaign.status === "failed" ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 cursor-pointer shadow-sm" :
                                                                "bg-blue-50 text-blue-700 border-blue-100"
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
                                                                {campaign.article?.headline || campaign.article?.body || "Generating..."}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleViewRawText(campaign)}
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
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        {campaign.status !== "failed" && (
                                                            <button
                                                                onClick={() => handleViewCampaign(campaign)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-all whitespace-nowrap"
                                                                title="Full Article Preview"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span>Preview</span>
                                                            </button>
                                                        )}
                                                        {campaign.videoUrl && (
                                                            <button
                                                                onClick={() => handleViewVideo(campaign.videoUrl)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all whitespace-nowrap"
                                                                title="Watch Source Video"
                                                            >
                                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                                <span>Watch Video</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center text-gray-500 font-medium italic">
                                                No campaigns found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid/Card View (visible below md) */}
                        <div className="block md:hidden divide-y divide-gray-150">
                            {campaigns.length > 0 ? (
                                campaigns.map((campaign) => (
                                    <div key={campaign._id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                                        {/* Client Info Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-gray-900 text-sm leading-snug break-words">
                                                    {campaign.userId?.name || "N/A"}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                                    <span className="text-[11px] text-gray-500 truncate block">
                                                        {campaign.userId?.email || "N/A"}
                                                    </span>
                                                    {campaign.userId?._id && (
                                                        <Link 
                                                            href={`/admin/users/${campaign.userId._id}/campaigns`}
                                                            className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                                                            title="View user campaigns"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                                <span 
                                                    onClick={() => campaign.status === "failed" && campaign.errorMessage ? handleViewError(campaign.errorMessage) : null}
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none border transition-all ${
                                                        campaign.status === "finished" || campaign.status === "published" || campaign.status === "submitted_successfully" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                        campaign.status === "failed" ? "bg-rose-50 text-rose-700 border-rose-105 hover:bg-rose-200 cursor-pointer shadow-sm" :
                                                        "bg-blue-50 text-blue-700 border-blue-105"
                                                    }`}
                                                >
                                                    {campaign.errorMessage?.toLowerCase().includes("language") ? "Unsupported Lang" : (campaign.errorMessage?.toLowerCase().includes("irrelevant") ? "Irrelevant Content" : campaign.status)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date and Time Info */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span>
                                                    {new Date(campaign.createdAt).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <span>
                                                {new Date(campaign.createdAt).toLocaleTimeString('en-GB', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Generated Text Preview */}
                                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150 text-xs">
                                            {campaign.status !== "failed" && (campaign.article?.headline || campaign.article?.body) ? (
                                                <div className="space-y-1.5">
                                                    <span className="text-gray-600 line-clamp-3 leading-relaxed break-words font-medium">
                                                        {campaign.article?.headline || campaign.article?.body || "Generating..."}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleViewRawText(campaign)}
                                                        className="text-[10px] text-primary font-bold uppercase tracking-wider underline hover:text-blue-700 block"
                                                    >
                                                        view full text
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-450 italic font-semibold">No text generated</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                            {campaign.status !== "failed" && (
                                                <button
                                                    onClick={() => handleViewCampaign(campaign)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-all w-full sm:w-auto h-10"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Preview Article
                                                </button>
                                            )}
                                            {campaign.videoUrl && (
                                                <button
                                                    onClick={() => handleViewVideo(campaign.videoUrl)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-150 transition-all w-full sm:w-auto h-10"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center text-gray-500 font-medium italic text-sm">
                                    No campaigns found matching your criteria
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination Container */}
            {campaigns.length > 0 && (
                <div className="mt-6 flex justify-center sm:justify-end">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                        totalResults={pagination.total}
                        itemsPerPage={pagination.limit}
                        className="mt-0 w-full sm:w-auto"
                    />
                </div>
            )}

            <FullArticlePreview
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                campaign={selectedCampaign}
                article={selectedCampaign?.article}
                productCard={selectedCampaign?.productCard}
            />

            <VideoModal
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                videoUrl={selectedVideoUrl}
            />

            {/* Error Modal */}
            <AnimatePresence>
                {isErrorModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <AlertCircle className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-wider text-xs sm:text-sm">Campaign Error</h3>
                                </div>
                                <button 
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 overflow-y-auto flex-1 min-h-0 bg-rose-50/30">
                                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                                    <p className="text-sm text-rose-800 leading-relaxed font-semibold break-words">
                                        {selectedError}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50 flex-shrink-0">
                                <button
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-150 hover:bg-gray-250 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all h-11 flex items-center justify-center font-bold"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, y: 10, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 10, opacity: 0 }}
                            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0 gap-4">
                                <div className="flex items-center gap-3 text-primary min-w-0">
                                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1 text-sm sm:text-base">{selectedText.headline}</h3>
                                </div>
                                <button 
                                    onClick={() => setIsTextModalOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-6 md:p-8 overflow-y-auto flex-1 min-h-0">
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium text-xs sm:text-sm break-words">
                                        {selectedText.body}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                                <button
                                    onClick={() => setIsTextModalOpen(false)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-205 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm h-11 flex items-center justify-center font-bold"
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
