"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminCategoryService } from "@/lib/api/admin/categories";
import { toast } from "react-toastify";
import { Plus, Trash2, Edit2, Loader2, Search, ChevronLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({ name: "", slug: "", description: "" });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await adminCategoryService.getCategories();
            setCategories(data.data);
        } catch (error) {
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setCurrentCategory(category);
            setFormData({ name: category.name, slug: category.slug, description: category.description || "" });
        } else {
            setCurrentCategory(null);
            setFormData({ name: "", slug: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (currentCategory) {
                await adminCategoryService.updateCategory(currentCategory._id, formData);
                toast.success("Category updated successfully");
            } else {
                await adminCategoryService.createCategory(formData);
                toast.success("Category created successfully");
            }
            fetchCategories();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await adminCategoryService.deleteCategory(currentCategory._id);
            toast.success("Category deleted successfully");
            fetchCategories();
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Auto-generate slug from name
    useEffect(() => {
        if (!currentCategory) {
            setFormData(prev => ({
                ...prev,
                slug: prev.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
            }));
        }
    }, [formData.name, currentCategory]);

    return (
        <div className="mx-auto">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/admin/blogs" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">Organize your blog content with categories</p>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-10 sm:h-11 px-5 sm:px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={18} /> Add Category
                </Button>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium text-gray-900 text-sm sm:text-base"
                    />
                    <Search className="absolute left-4 top-3.5 sm:top-3 h-5 w-5 text-gray-400" />
                </div>
            </div>

            {/* ── Content Area ── */}
            <div>
                {loading ? (
                    <div className="p-16 flex justify-center items-center bg-white border border-gray-200 rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-gray-500 font-medium text-sm">Loading categories...</p>
                        </div>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-16 text-center bg-white border border-gray-200 rounded-2xl text-gray-500 font-medium shadow-sm">
                        No categories found
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View (md and up) */}
                        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">
                                            <div className="flex flex-col gap-0.5">
                                                <span>Name</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Display Name</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 font-semibold">
                                            <div className="flex flex-col gap-0.5">
                                                <span>Slug</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">URL Identifier</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 font-semibold">Description</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCategories.map((category) => (
                                        <tr key={category._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900 leading-tight">
                                                    {category.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] text-gray-500 font-mono">
                                                    /{category.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-500 truncate max-w-xs">{category.description || "—"}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(category)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 transition-colors"
                                                        title="Edit Category"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCurrentCategory(category);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Grid/Card View (below md) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                            {filteredCategories.map((category) => (
                                <div key={category._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-bold text-gray-900 text-base leading-snug break-words">
                                                {category.name}
                                            </span>
                                            <span className="text-[11px] bg-gray-50 border border-gray-150 text-gray-600 font-mono px-2 py-0.5 rounded-md flex-shrink-0">
                                                /{category.slug}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-3">
                                            {category.description || <span className="italic text-gray-300">No description</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => handleOpenModal(category)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-blue-100 transition-colors text-xs font-semibold"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCurrentCategory(category);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs font-semibold"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Category Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSave} className="flex flex-col min-h-0">
                            {/* Modal Header */}
                            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                    {currentCategory ? "Edit Category" : "New Category"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Technology"
                                        className="h-12 bg-white border border-gray-300 rounded-xl font-bold text-gray-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Slug</label>
                                    <Input
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="technology"
                                        className="h-12 bg-white border border-gray-300 rounded-xl font-bold font-mono text-gray-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description..."
                                        className="w-full p-4 bg-white border border-gray-300 rounded-xl font-bold h-28 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-12 font-bold text-gray-500 hover:bg-gray-200 rounded-xl animate-none transition-colors"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center transition-colors"
                                >
                                    {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : "Save"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${currentCategory?.name}"? This will not delete blogs in this category, but they will be uncategorized.`}
            />
        </div>
    );
}
