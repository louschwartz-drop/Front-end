"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, ArrowRight, Newspaper, Tag, Loader2, Search, Globe, Filter } from "lucide-react";
import {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem
} from "@/components/ui/Select";
import LoginModal from "@/components/landingPage/LoginModal";
import { publicPressReleaseService } from "@/lib/api/public/press-releases";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

const COUNTRIES = [
    { code: "all", name: "Global / All" },
    { code: "us", name: "United States" },
    { code: "gb", name: "United Kingdom" },
    { code: "ca", name: "Canada" },
    { code: "au", name: "Australia" },
    { code: "in", name: "India" },
];

const CATEGORIES = [
    { id: "all", name: "All Categories" },
    { id: "technology", name: "Technology" },
    { id: "business", name: "Business" },
    { id: "science", name: "Science" },
    { id: "health", name: "Health" },
    { id: "general", name: "General" },
    { id: "sports", name: "Sports" },
    { id: "programming", name: "Programming" },
    { id: "finance", name: "Finance" },
];

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
            <SelectContent className="!bg-black/60 backdrop-blur-2xl !border-white/10 !text-white !rounded-2xl shadow-2xl z-[2000]">
                {options.map(opt => (
                    <SelectItem
                        key={opt.code || opt.id}
                        value={opt.code || opt.id}
                        className="hover:!bg-white/10 focus:!bg-white/10 !text-white/80 focus:!text-white cursor-pointer py-3"
                    >
                        {opt.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

const normalizePlatformArticle = (campaign) => ({
    id: campaign._id,
    title: campaign.article?.headline || "Untitled Press Release",
    description: campaign.article?.summary || "",
    image: campaign.productCard?.thumbnail || "/fallback-platform.jpeg",
    published: campaign.createdAt,
    author: campaign.productCard?.authorName || campaign.userId?.name || "Drop PR Author",
    category: [campaign.article?.productSummary?.category || "Platform"],
    url: `/press-releases/${campaign._id}`,
    isPlatform: true
});

export default function PressRoomClient({ initialNews, initialPlatform }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [articles, setArticles] = useState(() => {
        // If there are URL filters, don't use the initial un-filtered data
        const hasFilters = Array.from(searchParams.keys()).length > 0;
        if (hasFilters) return [];

        const platform = (initialPlatform || []).map(normalizePlatformArticle);
        const news = (initialNews || []);
        // Sort combined initial results by date
        return [...platform, ...news].sort((a, b) => new Date(b.published) - new Date(a.published));
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(() => Array.from(searchParams.keys()).length > 0);
    const [hasMore, setHasMore] = useState(true);
    const [country, setCountry] = useState(searchParams.get("country") || "all");
    const [category, setCategory] = useState(searchParams.get("category") || "all");
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const [showLoginModal, setShowLoginModal] = useState(false);

    const observer = useRef();
    const isFirstMount = useRef(true);

    const lastArticleElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Sync URL when filters change
    const updateUrl = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        if (country !== "all") params.set("country", country); else params.delete("country");
        if (category !== "all") params.set("category", category); else params.delete("category");
        if (activeTab !== "all") params.set("tab", activeTab); else params.delete("tab");
        if (searchTerm) params.set("q", searchTerm); else params.delete("q");

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [country, category, activeTab, searchTerm, pathname, router, searchParams]);

    // Fetch articles when filters change
    useEffect(() => {
        // Skip first fetch on mount since we have initialArticles, 
        // UNLESS there are search params (meaning we navigated back and need filtered data)
        if (isFirstMount.current) {
            isFirstMount.current = false;
            const hasFilters = Array.from(searchParams.keys()).length > 0;
            if (!hasFilters) {
                return;
            }
        }

        updateUrl();

        const resetAndFetch = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            try {
                let fetchNews = true;
                let fetchPlatform = true;
                let apiType = 'all';

                if (activeTab === 'news') {
                    fetchPlatform = false;
                    apiType = '1';
                } else if (activeTab === 'discussion') {
                    fetchPlatform = false;
                    apiType = '3';
                } else if (activeTab === 'platform') {
                    fetchNews = false;
                }

                // 1. Fetch News
                let newsResPromise = Promise.resolve({ articles: [] });
                if (fetchNews) {
                    const newsQuery = new URLSearchParams({
                        page: '1',
                        pageSize: '12',
                        keywords: searchTerm || "press release AI",
                        country,
                        category,
                        type: apiType
                    });
                    newsResPromise = fetch(`/api/press-releases?${newsQuery}`).then(res => res.json());
                }

                // 2. Fetch Platform Articles
                let platformPromise = Promise.resolve({ data: [] });
                if (fetchPlatform) {
                    platformPromise = publicPressReleaseService.getPlatformPressReleases({
                        search: searchTerm,
                        category: category,
                        limit: 20
                    });
                }

                const [newsData, platformData] = await Promise.all([
                    newsResPromise,
                    platformPromise
                ]);

                const normalizedPlatform = (platformData.data || []).map(normalizePlatformArticle);
                const news = (newsData.articles || []);

                const combined = [...normalizedPlatform, ...news].sort((a, b) => new Date(b.published) - new Date(a.published));

                setArticles(combined);

                if (activeTab === 'platform') {
                    setHasMore(false);
                } else {
                    setHasMore(newsData.articles?.length > 0 || platformData.data?.length > 0);
                }
            } catch (error) {
                console.error("Error filtering articles:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(resetAndFetch, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchTerm, country, category, activeTab]);

    // Fetch more articles (pagination)
    useEffect(() => {
        if (page === 1) return;

        const fetchMoreArticles = async () => {
            setLoading(true);
            try {
                if (activeTab === 'platform') {
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                const query = new URLSearchParams({
                    page: page.toString(),
                    pageSize: '12',
                    keywords: searchTerm || "press release AI",
                    country,
                    category,
                    type: activeTab === 'news' ? '1' : (activeTab === 'discussion' ? '3' : 'all')
                });
                const res = await fetch(`/api/press-releases?${query}`);
                const data = await res.json();

                if (data.articles && data.articles.length > 0) {
                    setArticles(prev => [...prev, ...data.articles]);
                    // If we got fewer articles than requested, we've reached the end
                    if (data.articles.length < 12) {
                        setHasMore(false);
                    }
                } else {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Error fetching more articles:", error);
                setHasMore(false);
            } finally {
                setLoading(false);
            }
        };

        fetchMoreArticles();
    }, [page]);

    return (
        <>
            {/* Integrated Hero & Filter Section */}
            <section className="relative pt-36 pb-28 bg-black overflow-hidden">
                {/* Background Image with Black Tint */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=2000"
                        alt="Newsroom background"
                        className="w-full h-full object-cover opacity-70 scale-100"
                    />
                    <div className="absolute inset-0 bg-black/45"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="max-w-3xl mx-auto mb-10">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight leading-tight" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                            Global Newsroom
                        </h1>
                        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                            Intelligent news aggregation for the next generation of AI brands.
                        </p>
                    </div>

                    {/* Search & Filters Container */}
                    <div className="max-w-6xl mx-auto w-full bg-white/5 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                        {/* Search Input */}
                        <div className="relative w-full group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-primary transition-colors w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by keywords (e.g., 'OpenAI', 'Tech Funding')..."
                                className="w-full h-14 pl-14 pr-6 bg-white/5 text-white text-lg placeholder:text-white/30 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-hidden transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters & Pills Row */}
                        <div className="flex flex-col xl:flex-row items-center gap-4 w-full">
                            {/* Custom Pills (Type) Filter - First Half */}
                            <div className={`flex flex-wrap items-center justify-center xl:justify-start gap-2.5 w-full ${activeTab === "platform" ? "" : "xl:w-1/2"}`}>
                                {[
                                    { id: "all", label: "All" },
                                    { id: "news", label: "News Articles" },
                                    { id: "discussion", label: "Discussion" },
                                    { id: "platform", label: "Drop PR Press Releases" }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-grow xl:flex-grow-0 px-4 h-14 rounded-2xl text-sm font-semibold transition-all duration-300 border backdrop-blur-md flex items-center justify-center whitespace-nowrap ${activeTab === tab.id
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/10"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab !== "platform" && (
                                <>
                                    {/* Divider */}
                                    <div className="hidden xl:block w-px h-10 bg-white/10 mx-1"></div>
                                    <div className="block xl:hidden w-full h-px bg-white/10 my-1"></div>

                                    {/* Dropdowns - Second Half */}
                                    <div className="flex flex-col sm:flex-row w-full xl:w-1/2 gap-3 justify-end">
                                        <StyledSelect
                                            icon={Globe}
                                            value={country}
                                            onChange={setCountry}
                                            options={COUNTRIES}
                                            label="Country"
                                        />
                                        <StyledSelect
                                            icon={Tag}
                                            value={category}
                                            onChange={setCategory}
                                            options={CATEGORIES}
                                            label="Category"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 max-w-7xl mx-auto px-4 min-h-[400px]">
                {articles && articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => {
                            const isLastElement = articles.length === index + 1;

                            const Wrapper = article.isPlatform ? Link : "a";
                            const wrapperProps = article.isPlatform
                                ? { href: article.url }
                                : { href: article.url, target: "_blank", rel: "noopener noreferrer" };

                            return (
                                <Wrapper
                                    key={`${article.id}-${index}`}
                                    ref={isLastElement ? lastArticleElementRef : null}
                                    {...wrapperProps}
                                    className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full"
                                >
                                    {/* Article Image */}
                                    <div className="relative h-64 overflow-hidden bg-gray-100">
                                        <img
                                            src={article.image !== "None" && article.image ? article.image : "/fallback-platform.jpeg"}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/fallback-platform.jpeg";
                                            }}
                                        />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            {article.isPlatform && (
                                                <span className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest shadow-lg">
                                                    Drop PR
                                                </span>
                                            )}
                                            <span className="bg-white/90 backdrop-blur-md text-brand-dark text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                {article.author || "Industry News"}
                                            </span>
                                            {article.country && (
                                                <span className="bg-white/90 backdrop-blur-md text-brand-dark text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                    {(() => {
                                                        const code = Array.isArray(article.country) ? article.country[0] : article.country;
                                                        const match = COUNTRIES.find(c => c.code.toLowerCase() === String(code).toLowerCase());
                                                        return match ? match.name : code;
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex-grow flex flex-col">
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                                                {article.published ? new Date(article.published).toLocaleDateString() : "Recently"}
                                            </div>
                                            <div className="flex items-center gap-1.5 capitalize">
                                                <Tag className="w-3.5 h-3.5 text-brand-blue" />
                                                {article.category?.[0] || "General"}
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-brand-blue transition-colors leading-snug">
                                            {article.title}
                                        </h2>

                                        <p className="text-gray-500 mb-8 line-clamp-3 text-sm leading-relaxed">
                                            {article.description || "Read the latest updates and announcements from the industry leaders in AI and media distribution."}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="inline-flex items-center gap-2 text-brand-blue font-bold text-sm">
                                                Read Article
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </Wrapper>
                            );
                        })}
                    </div>
                ) : !loading ? (
                    <div className="py-20 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Newspaper className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Articles Found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                ) : null}

                {loading && (
                    <div className="flex justify-center mt-20">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
                            <p className="text-sm font-medium text-gray-400">Updating results...</p>
                        </div>
                    </div>
                )}

                {!hasMore && articles.length > 0 && (
                    <div className="text-center mt-20 py-8 border-t border-gray-100">
                        <p className="text-gray-400 font-medium italic">You've explored all current news.</p>
                    </div>
                )}
            </section>

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
        </>
    );
}
