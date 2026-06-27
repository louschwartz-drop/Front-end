"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminCaseStudyService } from "@/lib/api/admin/caseStudies";
import { toast } from "react-toastify";
import { ChevronLeft, Save, Loader2, Image as ImageIcon, X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import CaseStudyRichTextEditor from "./CaseStudyRichTextEditor";
import ImageUploadModal from "../blog/ImageUploadModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

export default function CaseStudyForm({ initialData = null, isEditing: initialIsEditing = false, caseStudyId = null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(initialIsEditing || !!caseStudyId);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        featuredImage: "",
        status: "draft",
        authorName: "Hayden Hollis",
        authorRole: "Head of Growth Marketing · DropPR.ai",
        authorBio: "Hayden Hollis writes about content distribution, digital PR, SEO, AI search, and creator marketing. His work focuses on how brands and creators can extend the reach of their content beyond social media and improve visibility across search engines, news publishers, and AI-powered discovery platforms. He regularly covers strategies related to earned media, audience growth, authority building, and the evolving role of AI in online discovery.",
        authorImage: "",
        seo: {
            title: "",
            description: "",
            keywords: ""
        }
    });
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isAuthorImageModalOpen, setIsAuthorImageModalOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            populateForm(initialData);
        } else if (caseStudyId) {
            fetchCaseStudy();
        }
    }, [initialData, caseStudyId]);

    const populateForm = (data) => {
        setFormData({
            title: data.title || "",
            slug: data.slug || "",
            content: data.content || "",
            excerpt: data.excerpt || "",
            featuredImage: data.featuredImage || "",
            status: data.status || "draft",
            authorName: data.authorName || "Hayden Hollis",
            authorRole: data.authorRole || "Head of Growth Marketing · DropPR.ai",
            authorBio: data.authorBio || "Hayden Hollis writes about content distribution, digital PR, SEO, AI search, and creator marketing. His work focuses on how brands and creators can extend the reach of their content beyond social media and improve visibility across search engines, news publishers, and AI-powered discovery platforms. He regularly covers strategies related to earned media, audience growth, authority building, and the evolving role of AI in online discovery.",
            authorImage: data.authorImage || "",
            seo: {
                title: data.metaTitle || data.title || "",
                description: data.metaDescription || data.excerpt || "",
                keywords: data.metaKeywords || ""
            }
        });
    };

    const fetchCaseStudy = async () => {
        try {
            setLoading(true);
            const data = await adminCaseStudyService.getCaseStudyById(caseStudyId);
            populateForm(data.data);
            setIsEditing(true);
        } catch (error) {
            toast.error("Failed to fetch case study");
            router.push("/admin/case-studies");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("seo.")) {
            const seoField = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                seo: { ...prev.seo, [seoField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            toast.error("Title and Content are required");
            return;
        }

        try {
            setLoading(true);

            const submissionData = {
                ...formData,
                metaTitle: formData.seo.title,
                metaDescription: formData.seo.description,
                metaKeywords: formData.seo.keywords,
            };
            delete submissionData.seo;

            if (isEditing) {
                await adminCaseStudyService.updateCaseStudy(caseStudyId || initialData?._id, submissionData);
                toast.success("Case study updated successfully");
            } else {
                await adminCaseStudyService.createCaseStudy(submissionData);
                toast.success("Case study created successfully");
            }
            router.push("/admin/case-studies");
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save case study");
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_]+/g, "-")
            .replace(/^-+|-+$/g, "");
        setFormData(prev => ({ ...prev, slug }));
    };

    const [keywordInput, setKeywordInput] = useState("");

    const addKeyword = () => {
        const keyword = keywordInput.trim();
        if (keyword && !formData.seo.keywords.split(",").includes(keyword) && formData.seo.keywords.split(",").filter(Boolean).length < 5) {
            const currentKeywords = formData.seo.keywords.split(",").filter(Boolean);
            setFormData(prev => ({
                ...prev,
                seo: { ...prev.seo, keywords: [...currentKeywords, keyword].join(",") }
            }));
            setKeywordInput("");
        }
    };

    const removeKeyword = (keyword) => {
        const currentKeywords = formData.seo.keywords.split(",").filter(Boolean);
        setFormData(prev => ({
            ...prev,
            seo: { ...prev.seo, keywords: currentKeywords.filter(k => k !== keyword).join(",") }
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto pb-20 px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-gray-100 pb-5 md:pb-0 md:border-b-0">
                <div className="flex items-center gap-3 md:gap-4">
                    <Link href="/admin/case-studies" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 shrink-0">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">{isEditing ? "Edit Case Study" : "New Case Study"}</h1>
                        <p className="text-gray-500 mt-1 text-xs md:text-sm font-medium truncate">Create and manage your case study content</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                    <Link href="/admin/case-studies" className="flex-1 md:flex-none">
                        <Button variant="ghost" type="button" className="w-full h-10 px-4 rounded-xl font-bold border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-bold h-10 px-5 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {isEditing ? "Update" : "Publish"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Case Study Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter case study title..."
                                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-lg sm:text-xl text-gray-900"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Slug / URL</label>
                            <div className="flex gap-2 min-w-0">
                                <input
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    placeholder="case-study-url-slug"
                                    className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm text-gray-900"
                                    required
                                />
                                <Button type="button" onClick={generateSlug} variant="ghost" className="shrink-0 h-10 px-3 sm:px-4 rounded-xl text-xs font-bold border border-gray-200 whitespace-nowrap">
                                    Generate
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Excerpt <span className="normal-case font-normal text-gray-300">(short summary for cards)</span></label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Brief description of the case study..."
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900 resize-none leading-relaxed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Content</label>
                            <div className="relative">
                                <CaseStudyRichTextEditor
                                    value={formData.content}
                                    onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">SEO Optimization</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Meta Title</label>
                                <input
                                    name="seo.title"
                                    value={formData.seo.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Keywords ({formData.seo.keywords.split(",").filter(Boolean).length}/5)</label>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                        placeholder="Add keyword..."
                                        className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900 text-sm"
                                        disabled={formData.seo.keywords.split(",").filter(Boolean).length >= 5}
                                    />
                                    <Button type="button" onClick={addKeyword} className="h-10 px-4 rounded-xl bg-gray-900 text-white font-bold text-xs shrink-0" disabled={formData.seo.keywords.split(",").filter(Boolean).length >= 5}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.seo.keywords.split(",").filter(Boolean).map(keyword => (
                                        <span key={keyword} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                                            {keyword}
                                            <button type="button" onClick={() => removeKeyword(keyword)} className="text-gray-400 hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Meta Description</label>
                                <textarea
                                    name="seo.description"
                                    value={formData.seo.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium resize-none text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Media & Status</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Featured Image</label>
                            {formData.featuredImage ? (
                                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-gray-300 shadow-inner group">
                                    <img src={formData.featuredImage || null} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Featured" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button type="button" onClick={() => setIsImageModalOpen(true)} className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                                            <ImageIcon size={18} />
                                        </button>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, featuredImage: "" }))} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setIsImageModalOpen(true)}
                                    className="w-full aspect-[4/3] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group">
                                    <div className="p-4 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                                        <Plus size={28} />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest">Add Cover Image</span>
                                        <span className="text-[9px] font-medium text-gray-400">Recommended: 1200 x 900px (4:3)</span>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Publication Status</label>
                            <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                                <SelectTrigger className="w-full h-11 border-gray-300 rounded-xl font-bold text-gray-900">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Author Details Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Author Details</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Author Photo</label>
                            {formData.authorImage ? (
                                <div className="relative rounded-2xl overflow-hidden aspect-square border border-gray-300 shadow-inner group max-w-[120px]">
                                    <img src={formData.authorImage} className="w-full h-full object-cover" alt="Author" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button type="button" onClick={() => setIsAuthorImageModalOpen(true)} className="p-1.5 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                                            <ImageIcon size={14} />
                                        </button>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, authorImage: "" }))} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setIsAuthorImageModalOpen(true)}
                                    className="w-[120px] aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group">
                                    <Plus size={20} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Add Photo</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Author Name</label>
                            <input
                                name="authorName"
                                value={formData.authorName}
                                onChange={handleChange}
                                placeholder="Hayden Hollis"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm text-gray-900"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Author Role</label>
                            <input
                                name="authorRole"
                                value={formData.authorRole}
                                onChange={handleChange}
                                placeholder="Head of Growth Marketing · DropPR.ai"
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm text-gray-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Author Bio</label>
                            <textarea
                                name="authorBio"
                                value={formData.authorBio}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Short author biography..."
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm text-gray-900 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ImageUploadModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
                aspectRatio={4 / 3}
                title="Adjust Thumbnail Image"
            />

            <ImageUploadModal
                isOpen={isAuthorImageModalOpen}
                onClose={() => setIsAuthorImageModalOpen(false)}
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, authorImage: url }))}
                aspectRatio={1}
                title="Adjust Author Profile Photo"
            />
        </form>
    );
}
