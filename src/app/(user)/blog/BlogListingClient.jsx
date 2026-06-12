"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogService } from "@/lib/api/user/blogs";
import { Search, Calendar, ArrowRight, Sparkles, Clock, Tag, Filter, Eye } from "lucide-react";
import {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem
} from "@/components/ui/Select";
import LoginModal from "@/components/landingPage/LoginModal";
import userAuthStore from "@/store/userAuthStore";
import ShareMenu from "@/components/ui/ShareMenu";
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

const sortOptions = [
    { _id: "latest", name: "Newest First", slug: "latest" },
    { _id: "oldest", name: "Oldest First", slug: "oldest" },
    { _id: "views", name: "Most Popular", slug: "views" }
];

export default function BlogListingClient() {
    const router = useRouter();
    const { isAuthenticated } = userAuthStore();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("latest");
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

    // Fetch blogs when page or filters change (debounced)
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const data = await blogService.getPublishedBlogs({
                    page: pagination.page,
                    limit: pagination.limit,
                    search,
                    category: selectedCategory === "all" ? undefined : selectedCategory,
                    sort: sortBy === "latest" ? undefined : sortBy
                });
                setBlogs(data.data);
                setPagination(prev => ({ ...prev, total: data.pagination.total }));
            } catch (error) {
                console.error("Failed to fetch blogs", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        setBlogs([]);
        
        const timeoutId = setTimeout(fetchBlogs, 500);
        return () => clearTimeout(timeoutId);
    }, [pagination.page, search, selectedCategory, sortBy]);

    // Reset pagination when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [search, selectedCategory, sortBy]);

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-primary/10">
            <Header />

            <main className="relative">
                {/* Redesigned Premium Black Fade Hero with Centered Content */}
                <section className="relative pt-36 pb-28 bg-black overflow-hidden">
                    {/* Modern Office Teamwork Background with Reduced Black Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=2000"
                            alt="Modern Office Teamwork"
                            className="w-full h-full object-cover opacity-60 scale-100"
                        />
                        <div className="absolute inset-0 bg-black/45"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                        <div className="max-w-3xl mx-auto mb-10">
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight leading-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                                Latest Blog Insights
                            </h1>
                            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                Discover how AI is transforming PR and brand storytelling.
                            </p>
                        </div>

                        {/* Search & Double Filters Container */}
                        <div className="max-w-5xl mx-auto w-full bg-white/5 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-3">
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
                                <div className="w-full md:w-52">
                                    <StyledSelect
                                        icon={Tag}
                                        value={selectedCategory}
                                        onChange={setSelectedCategory}
                                        options={categories}
                                        label="Category"
                                    />
                                </div>

                                {/* Sort Filter */}
                                <div className="w-full md:w-52">
                                    <StyledSelect
                                        icon={Filter}
                                        value={sortBy}
                                        onChange={setSortBy}
                                        options={sortOptions}
                                        label="Sort By"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-6 py-20 relative">
                    {/* Blog Grid */}
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="font-black text-gray-300 uppercase tracking-widest text-[10px]">Loading Blogs...</p>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No blogs found matching your search</h3>
                            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogs.map((blog) => {
                                const rReadTime = Math.ceil(blog.content.length / 1000);
                                const authorInitials = (blog.authorName || 'LS').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                return (
                                    <Link
                                        href={`/blog/${blog.slug}`}
                                        key={blog._id}
                                        className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400 relative"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gray-100 flex-shrink-0">
                                            <img
                                                src={blog.featuredImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"}
                                                alt={blog.title}
                                                className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>

                                        {/* Category tags — in body, under thumbnail */}
                                        <div className="px-6 pt-6 flex flex-wrap gap-1.5 items-center">
                                            {blog.categories?.length > 0 && blog.categories.slice(0, 2).map((cat) => (
                                                <span key={cat._id} className="text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-primary/20 bg-primary/5">
                                                    {cat.name}
                                                </span>
                                            ))}
                                            {blog.viewCount >= 50 && (
                                                <span className="text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-primary/25 bg-blue-50/80 flex items-center gap-1 shadow-2xs">
                                                    <Sparkles className="w-2.5 h-2.5 text-primary/80 animate-pulse" />
                                                    Popular
                                                </span>
                                            )}
                                        </div>

                                        {/* Card body */}
                                        <div className="p-6 flex-grow flex flex-col">
                                            {/* Meta row */}
                                            <div className="flex items-center gap-1.5 mb-3" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-primary/60" />
                                                    {format(new Date(blog.publishedAt || blog.createdAt), "MMM d, yyyy")}
                                                </span>
                                                <span className="text-gray-200 text-xs">·</span>
                                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-primary/60" />
                                                    {rReadTime}&thinsp;min
                                                </span>
                                                {blog.viewCount > 0 && (
                                                    <>
                                                        <span className="text-gray-200 text-xs">·</span>
                                                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest flex items-center gap-1">
                                                            <Eye className="w-3 h-3 text-primary/60" />
                                                            {blog.viewCount > 999 ? `${(blog.viewCount / 1000).toFixed(1)}k` : blog.viewCount}
                                                        </span>
                                                    </>
                                                )}

                                                <div className="ml-auto flex-shrink-0 z-10">
                                                    <ShareMenu
                                                        url={`/blog/${blog.slug}`}
                                                        title={blog.title}
                                                        text={blog.excerpt}
                                                        position="bottom-right"
                                                    />
                                                </div>
                                            </div>


                                            {/* Title */}
                                            <h2 style={{
                                                fontFamily: 'var(--font-serif, Georgia, serif)',
                                                fontSize: '19px',
                                                fontWeight: 700,
                                                lineHeight: 1.3,
                                                letterSpacing: '-0.01em',
                                                color: '#0a0e1a',
                                                marginBottom: '10px'
                                            }} className="line-clamp-2 group-hover:text-primary transition-colors">
                                                {blog.title}
                                            </h2>

                                            {/* Excerpt */}
                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-grow"
                                                style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                                {blog.excerpt || "Read the latest updates and announcements from DropPR.ai."}
                                            </p>

                                            {/* Footer CTA + author */}
                                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between mt-auto">
                                                <span className="inline-flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                    Read Blog
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                                                </span>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                                        Published by : {blog.authorName || "Hayden Hollis"}
                                                    </span>
                                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-[8px] font-black">{authorInitials}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && blogs.length > 0 && pagination.total > pagination.limit && (
                        <div className="mt-16 flex justify-center items-center gap-2">
                            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${pagination.page === i + 1
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
                                onClick={() => {
                                    if (isAuthenticated) {
                                        router.push("/user/dashboard/create");
                                    } else {
                                        setShowLoginModal(true);
                                    }
                                }}
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
