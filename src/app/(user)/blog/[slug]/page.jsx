import { blogService } from "@/lib/api/user/blogs";
import { format } from "date-fns";
import { Calendar, Clock, ArrowRight, X, Eye } from "lucide-react";
import Link from "next/link";
import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import Button from "@/components/ui/Button";
import ShareMenu from "@/components/ui/ShareMenu";

async function getBlog(slug) {
  try {
    const data = await blogService.getBlogBySlug(slug);
    return data.data;
  } catch (error) {
    return null;
  }
}

async function getRelatedBlogs(currentBlogId, categorySlug) {
  try {
    // Try category-matched first
    if (categorySlug) {
      const data = await blogService.getPublishedBlogs({
        limit: 4,
        category: categorySlug,
      });
      const matched = data.data
        .filter((b) => b._id !== currentBlogId)
        .slice(0, 3);
      if (matched.length >= 2) return matched;
    }
    // Fallback: just get latest blogs regardless of category
    const data = await blogService.getPublishedBlogs({ limit: 5 });
    return data.data.filter((b) => b._id !== currentBlogId).slice(0, 3);
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    return { title: "Blog Not Found - DropPR.ai" };
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

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
            <X size={40} className="text-gray-200" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">
            Article Not Found
          </h1>
          <p className="text-gray-500 font-bold mb-10 max-w-sm">
            The blog post you are looking for doesn't exist or has been moved.
          </p>
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
  const categorySlug =
    blog.categories?.length > 0 ? blog.categories[0].slug : null;
  const relatedBlogs = await getRelatedBlogs(blog._id, categorySlug);
  const authorInitials = (blog.authorName || "Lou Schwartz")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="min-h-screen selection:bg-primary/10"
      style={{ background: "#fafaf7" }}
    >
      <Header />

      <main className="pt-28 pb-8">
        <article className="relative">
          {/* ── Article Header ── */}
          <header className="max-w-4xl mx-auto px-6 mt-8 mb-0 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Title */}
            <h1
              className="text-3xl md:text-[46px] leading-tight md:leading-[1.08]"
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                marginBottom: "20px",
                color: "#0a0e1a",
              }}
            >
              {blog.title}
            </h1>

            {/* Description — italic serif under title */}
            {blog.description && (
              <p
                className="text-lg md:text-[22px] leading-normal md:leading-[1.45]"
                style={{
                  color: "#5f5f5f",
                  fontStyle: "italic",
                  marginBottom: "32px",
                  fontFamily: "Charter, Georgia, serif",
                }}
              >
                {blog.description}
              </p>
            )}

            {/* Excerpt fallback */}
            {!blog.description && blog.excerpt && (
              <p
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}
                className="text-lg md:text-xl text-gray-600 mb-8"
              >
                {blog.excerpt}
              </p>
            )}

            <hr className="border-gray-200 mb-6" />

            {/* Author Row */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {blog.authorImage ? (
                  <img
                    src={blog.authorImage}
                    alt={blog.authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-black">
                    {authorInitials}
                  </span>
                )}
              </div>
              {/* Meta */}
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  By {blog.authorName || "Lou Schwartz"}
                </p>
                <div className="flex items-center gap-0 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {blog.authorRole || "Founder · DropPR.ai"}
                  </span>
                  <span className="text-xs text-gray-300 mx-2">·</span>
                  <span className="text-xs text-gray-500">
                    {readTime}&thinsp;min read
                  </span>
                  <span className="text-xs text-gray-300 mx-2">·</span>
                  <span className="text-xs text-gray-500">
                    Published&nbsp;
                    {format(
                      new Date(blog.publishedAt || blog.createdAt),
                      "MMMM d, yyyy",
                    )}
                  </span>
                  {blog.viewCount > 0 && (
                    <>
                      <span className="text-xs text-gray-300 mx-2">·</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye size={12} className="text-primary/60" />
                        {blog.viewCount.toLocaleString()}&thinsp;views
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="ml-auto z-10 flex items-center gap-2">
                <ShareMenu 
                  url={`/blog/${blog.slug}`} 
                  title={blog.title} 
                  text={blog.excerpt} 
                  position="bottom-left"
                />
              </div>
            </div>

            <hr className="border-gray-200" />
          </header>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="max-w-4xl mx-auto px-6 mt-6 mb-8 animate-in fade-in zoom-in-95 duration-1000">
              <div className="w-full h-[260px] md:h-[420px] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>
          )}

          {/* Article Body */}
          <div className="max-w-4xl mx-auto px-6">
            <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              {/* Drop-cap wrapper — gives the first p its own containing block */}
              <div className="blog-content">
                <div dangerouslySetInnerHTML={{ __html: blog.content }} />
              </div>

              {/* Tags */}
              {blog.tags?.length > 0 && (
                <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Bio Card */}
              <div className="mt-16 pt-10 border-t border-gray-200">
                <div className="flex gap-5 items-start">
                  <div
                    className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 35%, #5a2a27 0%, #2c1210 100%)",
                    }}
                  >
                    {blog.authorImage ? (
                      <img
                        src={blog.authorImage}
                        alt={blog.authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-black text-lg tracking-wide">
                        {authorInitials}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: "#0a0e1a",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {blog.authorName || "Lou Schwartz"}
                    </p>
                    <p
                      className="text-xs font-black uppercase tracking-widest mb-3"
                      style={{ color: "#0A5CFF" }}
                    >
                      {blog.authorRole || "Founder · DropPR.ai"}
                    </p>
                    {blog.authorBio && (
                      <p
                        style={{
                          fontFamily: "var(--font-serif, Georgia, serif)",
                          fontSize: "0.95rem",
                          lineHeight: 1.7,
                          color: "#374151",
                        }}
                      >
                        {blog.authorBio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>


        {relatedBlogs.length > 0 && (
          <section
            style={{
              background: "#fafaf7",
              borderTop: "1px solid #e8e4de",
              marginTop: "3rem",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-10">
              {/* Heading */}
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#0A5CFF",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Keep Reading
                  </p>
                  <h2
                    style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: "32px",
                      fontWeight: 700,
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                      color: "#0a0e1a",
                      margin: 0,
                    }}
                  >
                    More Articles
                  </h2>
                </div>
                <Link
                  href="/blog"
                  style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
                  className="group flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest hover:gap-3.5 transition-all"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedBlogs.map((rBlog) => {
                  const rReadTime = Math.ceil(rBlog.content.length / 1000);
                  const rInitials = (rBlog.authorName || "LS")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <Link
                      href={`/blog/${rBlog.slug}`}
                      key={rBlog._id}
                      className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-400 relative"
                    >
                      {/* Thumbnail — no badges on image */}
                      <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gray-100 flex-shrink-0">
                        <img
                          src={rBlog.featuredImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"}
                          alt={rBlog.title}
                          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-600"
                        />
                      </div>

                      {/* Card body */}
                      <div
                        className="p-5 flex-grow flex flex-col"
                        style={{
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        }}
                      >
                        {/* Category tags — in body, under thumbnail */}
                        {rBlog.categories?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {rBlog.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat._id}
                                className="text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-primary/20 bg-primary/5"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {format(
                              new Date(rBlog.publishedAt || rBlog.createdAt),
                              "MMM d, yyyy",
                            )}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {rReadTime}&thinsp;min read
                          </span>
                          {rBlog.viewCount > 0 && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                                <Eye size={9} className="text-gray-300" />
                                {rBlog.viewCount > 999
                                  ? `${(rBlog.viewCount / 1000).toFixed(1)}k`
                                  : rBlog.viewCount}
                              </span>
                            </>
                          )}
                          
                          <div className="ml-auto flex-shrink-0 z-10">
                            <ShareMenu 
                              url={`/blog/${rBlog.slug}`} 
                              title={rBlog.title} 
                              text={rBlog.excerpt} 
                              position="bottom-right"
                            />
                          </div>
                        </div>

                        {/* Title — serif */}
                        <h3
                          style={{
                            fontFamily: "var(--font-serif, Georgia, serif)",
                            fontSize: "17px",
                            fontWeight: 700,
                            lineHeight: 1.35,
                            letterSpacing: "-0.01em",
                            color: "#0a0e1a",
                            marginBottom: "8px",
                          }}
                          className="line-clamp-2 group-hover:text-primary transition-colors"
                        >
                          {rBlog.title}
                        </h3>

                        {/* Excerpt */}
                        {rBlog.excerpt && (
                          <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                            {rBlog.excerpt}
                          </p>
                        )}

                        {/* CTA footer */}
                        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-widest">
                            Read Article
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                              Published by : {rBlog.authorName || "Lou Schwartz"}
                            </span>
                            <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                              <span className="text-white text-[7px] font-black">
                                {rInitials}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
