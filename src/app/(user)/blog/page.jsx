"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogService } from "@/lib/api/user/blogs";
import { Search, Calendar, ArrowRight, Loader2, Sparkles, Clock, ChevronRight, Tag, Filter, Globe, Newspaper } from "lucide-react";
import { 
    Select, 
    SelectGroup, 
    SelectValue, 
    SelectTrigger, 
    SelectContent, 
    SelectItem 
} from "@/components/ui/Select";
import LoginModal from "@/components/landingPage/LoginModal";
import Button from "@/components/ui/Button";
import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import { format } from "date-fns";

const StyledSelect = ({ icon: Icon, value, onChange, options, label }) => (
    <div className="relative flex-grow group">
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger 
                className="!w-full !h-14 !pl-11 !pr-4 !bg-white/10 hover:!bg-white/20 !text-white !text-sm !border-white/20 !rounded-2xl !focus:ring-2 !focus:ring-primary/50 !outline-hidden transition-all backdrop-blur-md relative"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 !text-white/60 group-hover:!text-white transition-colors z-10">
                    <Icon className="w-4 h-4" />
                </div>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent className="!bg-brand-dark/95 backdrop-blur-2xl !border-white/10 !text-white !rounded-2xl shadow-2xl z-[2000]">
                {options.map(opt => (
                    <SelectItem 
                        key={opt._id} 
                        value={opt.slug}
                        className="hover:!bg-white/10 focus:!bg-white/10 !text-white/80 focus:!text-white cursor-pointer py-3"
                    >
                        {opt.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

export default function BlogListing() {
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await blogService.getPublicCategories();
                setCategories([{ _id: "all", name: "All Categories", slug: "all" }, ...data.data]);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [pagination.page, selectedCategory]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const data = await blogService.getPublishedBlogs({
                page: pagination.page,
                limit: pagination.limit,
                search,
                category: selectedCategory === "all" ? undefined : selectedCategory
            });
            setBlogs(data.data);
            setPagination(prev => ({ ...prev, total: data.pagination.total }));
        } catch (error) {
            console.error("Failed to fetch blogs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchBlogs();
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-primary/10">
            <Header />
            
            <main className="relative">
                {/* Restored Centered Robot Hero */}
                {/* Integrated Hero & Filter Section */}
                <section className="relative pt-32 pb-24 bg-brand-dark overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=2000" 
                            alt="AI Robot" 
                            className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-brand-dark/95 via-brand-dark/80 to-white/5"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Insights</span> & AI <span className="text-primary">Transformations</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-12 leading-relaxed">
                            Discover how artificial intelligence is redefining professional public relations and brand storytelling.
                        </p>

                        {/* Search & Filters Container */}
                        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                                {/* Search Input */}
                                <div className="relative flex-grow group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-primary transition-colors w-5 h-5" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by topic or keyword..."
                                        className="w-full h-14 pl-14 pr-6 bg-white/5 text-white text-lg placeholder:text-white/30 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-hidden transition-all"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                {/* Category Filter */}
                                <div className="w-full md:w-64">
                                    <StyledSelect 
                                        icon={Tag} 
                                        value={selectedCategory} 
                                        onChange={setSelectedCategory} 
                                        options={categories} 
                                        label="Category"
                                    />
                                </div>

                                <button type="submit" className="h-14 px-10 bg-primary text-white font-bold rounded-2xl hover:shadow-xl transition-all scale-100 hover:scale-105">
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-6 py-20 relative">
                    {/* Blog Grid */}
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="font-black text-gray-300 uppercase tracking-widest text-[10px]">Filtering Knowledge...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog, idx) => (
                                <Link 
                                    href={`/blog/${blog.slug}`} 
                                    key={blog._id} 
                                    className="group flex flex-col h-full bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="relative h-64 overflow-hidden bg-gray-100">
                                        <img 
                                            src={blog.featuredImage || "/press-hero-v2.png"} 
                                            alt={blog.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4">
                                            {blog.categories.slice(0, 1).map(cat => (
                                                <span key={cat._id} className="bg-white/90 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                    {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-8 flex-grow flex flex-col">
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                                {format(new Date(blog.publishedAt || blog.createdAt), "MMM dd, yyyy")}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-primary" />
                                                {Math.ceil(blog.content.length / 1000)} min read
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                            {blog.title}
                                        </h2>
                                        <p className="text-gray-500 mb-8 line-clamp-3 text-sm leading-relaxed">
                                            {blog.excerpt || "Read the latest updates and announcements from the industry leaders in AI and media distribution."}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                                                Read Article 
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && blogs.length > 0 && pagination.total > pagination.limit && (
                        <div className="mt-16 flex justify-center items-center gap-2">
                            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                                        pagination.page === i + 1 
                                        ? "bg-primary text-white shadow-lg scale-110" 
                                        : "bg-white border border-gray-200 text-gray-400 hover:border-primary hover:text-primary"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Call to Action - Integrated with LoginModal */}
                <section className="bg-gray-50 py-20">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto bg-linear-to-r from-brand-dark to-brand-blue rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                                Want to see your brand here?
                            </h2>
                            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                                Use DropPR.ai to turn your content into professional press releases and distribute them across our global media network.
                            </p>
                            <button 
                                onClick={() => setShowLoginModal(true)}
                                className="inline-flex items-center gap-2 px-10 py-4 bg-white text-brand-dark font-bold rounded-xl hover:shadow-xl transition-all scale-100 hover:scale-105"
                            >
                                Start Publishing Now
                                <ArrowRight className="w-5 h-4" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Login Modal Integration */}
                <LoginModal 
                    isOpen={showLoginModal} 
                    onClose={() => setShowLoginModal(false)}
                    onSuccess={() => {
                        setShowLoginModal(false);
                        router.push("/user/dashboard/create");
                    }}
                />
            </main>

            <Footer />
        </div>
    );
}
