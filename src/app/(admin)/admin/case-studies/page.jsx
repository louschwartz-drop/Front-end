"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminCaseStudyService } from "@/lib/api/admin/caseStudies";
import { toast } from "react-toastify";
import { Plus, Trash2, Edit2, Loader2, Search, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

export default function CaseStudyList() {
    const [caseStudies, setCaseStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        fetchCaseStudies();
    }, [pagination.page, status]);

    const fetchCaseStudies = async () => {
        try {
            setLoading(true);
            const data = await adminCaseStudyService.getCaseStudies({
                page: pagination.page,
                limit: pagination.limit,
                status: status === "all" ? "" : status,
                search
            });
            setCaseStudies(data.data);
            setPagination(prev => ({ ...prev, total: data.pagination.total }));
        } catch (error) {
            toast.error("Failed to fetch case studies");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await adminCaseStudyService.deleteCaseStudy(itemToDelete._id);
            toast.success("Case study deleted successfully");
            fetchCaseStudies();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete case study");
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCaseStudies();
    };

    return (
        <div className="mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Case Studies</h1>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage and publish your case study content</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Link href="/admin/case-studies/create" className="flex-1 sm:flex-none">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 sm:h-11 px-4 sm:px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm">
                            <Plus size={16} /> New Case Study
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Search case studies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium text-gray-900"
                    />
                    <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                </form>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-gray-300 shadow-sm self-start sm:self-auto">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Status</label>
                    <Select value={status} onValueChange={(val) => setStatus(val)}>
                        <SelectTrigger className="w-36 sm:w-40 h-9 sm:h-10 border-gray-300 rounded-xl text-xs font-bold text-gray-900">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center items-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : caseStudies.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 font-medium">
                        No case studies found
                    </div>
                ) : (
                    <>
                        {/* MOBILE CARD VIEW */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {caseStudies.map((item) => (
                                <div key={item._id} className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-16 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                            <img src={item.featuredImage || null} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 leading-tight line-clamp-2 text-sm">{item.title}</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">/{item.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === "published" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[11px] text-gray-400 font-bold ml-auto">
                                            {format(new Date(item.createdAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        {item.status === "published" && (
                                            <a href={`/case-studies/${item.slug}`} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-primary transition-colors">
                                                <ExternalLink size={15} />
                                            </a>
                                        )}
                                        <Link href={`/admin/case-studies/edit/${item._id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 transition-colors text-xs font-bold">
                                            <Edit2 size={13} /> Edit
                                        </Link>
                                        <button onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs font-bold">
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600 min-w-[680px]">
                                <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">
                                            <div className="flex flex-col gap-0.5"><span>Case Study</span><span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Title & Slug</span></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-center">Status</th>
                                        <th className="px-5 py-4 font-semibold whitespace-nowrap">Date</th>
                                        <th className="px-5 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {caseStudies.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-14 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                                        <img src={item.featuredImage || null} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-gray-900 leading-tight truncate max-w-[180px] lg:max-w-[300px]">{item.title}</span>
                                                        <span className="text-[11px] text-gray-500 font-medium truncate max-w-[180px] lg:max-w-[300px]">/{item.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${item.status === "published" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500 font-bold whitespace-nowrap">
                                                {format(new Date(item.createdAt), "MMM dd, yyyy")}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status === "published" && (
                                                        <a href={`/case-studies/${item.slug}`} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-primary transition-colors">
                                                            <ExternalLink size={15} />
                                                        </a>
                                                    )}
                                                    <Link href={`/admin/case-studies/edit/${item._id}`}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 transition-colors">
                                                        <Edit2 size={15} />
                                                    </Link>
                                                    <button onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Case Study"
                message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
            />
        </div>
    );
}
