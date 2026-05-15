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
                toast.success("Category updated");
            } else {
                await adminCategoryService.createCategory(formData);
                toast.success("Category created");
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
            toast.success("Category deleted");
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
        <div className="mx-auto px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blogs" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-600 mt-1">Organize your blog content with categories</p>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Plus size={18} /> Add Category
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="relative flex-1 md:max-w-md">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium text-gray-900"
                    />
                    <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading categories...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                    <tr key={category._id} className="hover:bg-gray-50 transition-colors">
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
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentCategory(category);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium">
                                            No categories found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Category Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSave}>
                            <div className="p-8">
                                <h2 className="text-2xl font-black text-gray-900 mb-6">
                                    {currentCategory ? "Edit Category" : "New Category"}
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Name</label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Technology"
                                            className="h-12 bg-white border border-gray-300 rounded-xl font-bold text-gray-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Slug</label>
                                        <Input
                                            required
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="technology"
                                            className="h-12 bg-white border border-gray-300 rounded-xl font-bold font-mono text-gray-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description..."
                                            className="w-full p-4 bg-white border border-gray-300 rounded-xl font-bold h-32 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-12 font-bold text-gray-500 hover:bg-gray-200 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Save Category"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)} // Fixed: should be false to close
                onConfirm={handleDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${currentCategory?.name}"? This will not delete blogs in this category, but they will be uncategorized.`}
            />
        </div>
    );
}
