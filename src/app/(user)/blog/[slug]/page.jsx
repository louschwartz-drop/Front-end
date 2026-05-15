import { blogService } from "@/lib/api/user/blogs";
import { format } from "date-fns";
import { Calendar, User, Clock, ChevronLeft, Tag, ArrowRight, X, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import Button from "@/components/ui/Button";

async function getBlog(slug) {
    try {
        const data = await blogService.getBlogBySlug(slug);
        return data.data;
    } catch (error) {
        return null;
    }
}

async function getRelatedBlogs(categorySlug, currentBlogId) {
    try {
        const data = await blogService.getPublishedBlogs({ 
            limit: 4, 
            category: categorySlug 
        });
        return data.data.filter(b => b._id !== currentBlogId).slice(0, 3);
    } catch (error) {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (!blog) {
        return {
            title: "Blog Not Found - DropPR.ai",
        };
    }

    return {
        title: `${blog.metaTitle || blog.title} - DropPR.ai Blog`,
        description: blog.metaDescription || blog.excerpt,
        keywords: blog.metaKeywords || blog.tags?.join(", ") || "",
        openGraph: {
            title: blog.title,
            description: blog.excerpt,
            images: [blog.featuredImage],
            type: "article",
            publishedTime: blog.publishedAt || blog.createdAt,
            authors: [blog.author?.name || "Admin"],
        },
        twitter: {
            card: "summary_large_image",
            title: blog.title,
            description: blog.excerpt,
            images: [blog.featuredImage],
        },
    };
}

export default async function BlogDetail({ params }) {
    const { slug } = await params;
    const blog = await getBlog(slug);
    
    let relatedBlogs = [];
    if (blog && blog.categories?.length > 0) {
        relatedBlogs = await getRelatedBlogs(blog.categories[0].slug, blog._id);
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                        <X size={40} className="text-gray-200" />
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Article Not Found</h1>
                    <p className="text-gray-500 font-bold mb-10 max-w-sm">The blog post you are looking for doesn't exist or has been moved to a new location.</p>
                    <Link href="/blog">
                        <Button className="bg-primary text-white font-black h-14 px-10 rounded-2xl shadow-xl shadow-primary/20">
                            Explore Other Articles
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const readTime = Math.ceil(blog.content.length / 1000);

    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            <Header />

            <main className="pt-32 pb-32">
                <article className="relative">
                    {/* Go Back Button */}
                    <div className="max-w-5xl mx-auto px-6 mb-12">
                        <Link href="/blog" className="group inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px]">
                            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                                <ChevronLeft size={16} />
                            </div>
                            Go Back to Listing
                        </Link>
                    </div>

                    {/* Hero Section */}
                    <header className="max-w-5xl mx-auto px-6 mb-16 text-center">
                        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {blog.categories.map(cat => (
                                <span key={cat._id} className="px-5 py-1.5 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[1] mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            {blog.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-primary/30" />
                                <span>{format(new Date(blog.publishedAt || blog.createdAt), "MMMM dd, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary/30" />
                                <span>{readTime} min read</span>
                            </div>
                        </div>
                    </header>

                    {/* Centered Rectangular Featured Image */}
                    <div className="max-w-[800px] mx-auto mb-20 animate-in fade-in zoom-in-95 duration-1000 px-6">
                        <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <img 
                                src={blog.featuredImage || null} 
                                alt={blog.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Article Content Layout */}
                    <div className="max-w-7xl mx-auto px-6 flex justify-center">
                        {/* Article Main Content */}
                        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                            <div className="prose prose-xl prose-blue max-w-none 
                                prose-p:text-gray-600 prose-p:font-medium prose-p:leading-[1.8] 
                                prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tighter
                                prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8
                                prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-2xl prose-blockquote:px-10 prose-blockquote:py-8 prose-blockquote:not-italic prose-blockquote:text-gray-900 prose-blockquote:font-bold
                                prose-img:rounded-[2.5rem] prose-img:shadow-2xl
                                prose-ul:space-y-4 prose-li:font-medium prose-li:text-gray-600
                            ">
                                <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                            </div>

                            {/* Tags */}
                            <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
                                {blog.tags?.map(tag => (
                                    <span key={tag} className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>

                {/* Related Blogs Section */}
                {relatedBlogs.length > 0 && (
                    <section className="mt-32 py-32 bg-gray-50/50 border-y border-gray-100">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="flex items-center justify-between mb-16">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Related Articles</h2>
                                    <p className="text-gray-400 font-medium text-sm">More insights on similar topics you might enjoy.</p>
                                </div>
                                <Link href="/blog" className="group flex items-center gap-3 text-primary font-black uppercase tracking-widest text-[10px] hover:gap-5 transition-all">
                                    View All Posts <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {relatedBlogs.map((rBlog) => (
                                    <Link 
                                        href={`/blog/${rBlog.slug}`} 
                                        key={rBlog._id} 
                                        className="group flex flex-col h-full bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="relative h-56 overflow-hidden bg-gray-100">
                                            <img 
                                                src={rBlog.featuredImage || "/press-hero-v2.png"} 
                                                alt={rBlog.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 left-4">
                                                {rBlog.categories.slice(0, 1).map(cat => (
                                                    <span key={cat._id} className="bg-white/90 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                                        {cat.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-8 flex-grow flex flex-col">
                                            <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                                    {format(new Date(rBlog.publishedAt || rBlog.createdAt), "MMM dd, yyyy")}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    {Math.ceil(rBlog.content.length / 1000)} min read
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                                {rBlog.title}
                                            </h3>
                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                    Read Article 
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
}
