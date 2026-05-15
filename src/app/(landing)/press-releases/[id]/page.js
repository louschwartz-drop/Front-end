import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag, Share2, ExternalLink } from "lucide-react";

async function getArticle(id) {
    // Check if ID is a MongoDB ObjectId (24 char hex)
    const isLocalId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isLocalId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        try {
            const res = await fetch(`${baseUrl}/public/press-releases/${id}`, {
                next: { revalidate: 300 }
            });
            if (!res.ok) return null;
            const data = await res.json();
            
            // Map platform data to shared article format
            const campaign = data.data;
            if (!campaign) return null;

            return {
                id: campaign._id,
                title: campaign.article?.headline,
                description: campaign.article?.summary,
                body: campaign.article?.body,
                introduction: campaign.article?.introduction,
                image: campaign.productCard?.thumbnail,
                author: campaign.productCard?.authorName || campaign.userId?.name,
                published: campaign.createdAt,
                category: [campaign.article?.productSummary?.category || "Platform"],
                isPlatform: true,
                campaign: campaign // Store full campaign for extra fields
            };
        } catch (error) {
            console.error("Platform Detail Fetch Error:", error);
            return null;
        }
    }

    const API_KEY = process.env.CURRENTS_API_KEY || "dXND77Am6Zv7gvZe37eGWWZEmDJwHIXNzAefrIvpqlg7vxqw";
    const url = `https://api.currentsapi.services/v1/search?apiKey=${API_KEY}&keywords=press%20release%20AI&country=us&language=en&category=technology&page_size=100`;

    try {
        const res = await fetch(url, { 
            next: { revalidate: 3600 }
        });
        const data = await res.json();
        const article = data.news?.find(a => a.id === id) || null;
        if (article) article.isPlatform = false;
        return article;
    } catch (error) {
        console.error("Fetch Article Error:", error);
        return null;
    }
}

export default async function ArticleDetailsPage({ params }) {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-32 text-center">
                    <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
                    <p className="text-gray-600 mb-8">The article you are looking for might have been moved or is no longer available.</p>
                    <Link href="/press-releases" className="text-brand-blue font-bold flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> Back to Press Room
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/press-releases" className="hover:text-primary transition-colors">Press Room</Link>
                            <span>/</span>
                            <span className="text-gray-900 truncate max-w-[200px] md:max-w-md">{article.title}</span>
                        </nav>

                        {/* Article Header */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                            {/* Hero Image */}
                            <div className="relative h-[400px] w-full bg-gray-100">
                                <img 
                                    src={article.image !== "None" && article.image ? article.image : "/hero3.png"} 
                                    alt={article.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = "/hero3.png"; }}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-8 md:p-12">
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <span className="bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
                                            {article.category?.[0] || "AI News"}
                                        </span>
                                        <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                                            <Calendar className="w-4 h-4" />
                                            {article.published ? new Date(article.published).toLocaleDateString(undefined, { dateStyle: 'long' }) : "Recently"}
                                        </div>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                                        {article.title}
                                    </h1>
                                </div>
                            </div>

                            {/* Article Body */}
                            <div className="p-8 md:p-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">Published by</p>
                                            <p className="font-bold text-gray-900">{article.author || "Industry Journalist"}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600" title="Share Article">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        {!article.isPlatform ? (
                                            <a 
                                                href={article.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-brand-blue transition-all shadow-lg shadow-primary/20"
                                            >
                                                View Original
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100">
                                                <Globe className="w-4 h-4" />
                                                Platform Verified
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                                    <p className="text-xl font-medium text-gray-900 mb-8 italic border-l-4 border-primary pl-6 py-2">
                                        {article.description}
                                    </p>
                                    
                                    <div className="space-y-6">
                                        {article.isPlatform ? (
                                            <>
                                                {article.introduction && (
                                                    <div className="text-lg font-medium text-gray-800 mb-6">
                                                        {article.introduction}
                                                    </div>
                                                )}
                                                <div className="whitespace-pre-wrap">
                                                    {article.body}
                                                </div>
                                                {article.campaign?.article?.conclusion && (
                                                    <div className="mt-8 font-medium italic">
                                                        {article.campaign.article.conclusion}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p>
                                                    Artificial Intelligence continues to reshape the landscape of modern business and technology distribution. This latest announcement highlights the accelerating pace of innovation in the US market, particularly within the technology and media sectors.
                                                </p>
                                                <p>
                                                    As brands increasingly turn to automated solutions for content generation and media distribution, the role of professional press release services like DropPR.ai becomes even more critical in ensuring quality and authenticity.
                                                </p>
                                                <p>
                                                    For more detailed information regarding this breakthrough and its implications for your industry, we recommend viewing the full announcement on the original publication platform.
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Platform Specific Action */}
                                    {article.isPlatform ? (
                                        <div className="mt-12 p-8 bg-brand-dark rounded-2xl text-white shadow-xl relative overflow-hidden">
                                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                             <h3 className="text-xl font-bold mb-4 relative z-10">Featured Campaign</h3>
                                             <p className="text-blue-100 mb-6 relative z-10">
                                                 This press release was generated and distributed using the DropPR.ai platform.
                                             </p>
                                             <Link 
                                                 href="/auth/register"
                                                 className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-dark font-bold rounded-xl hover:shadow-md transition-all relative z-10"
                                             >
                                                 Create Your Own
                                                 <ArrowRight className="w-4 h-4" />
                                             </Link>
                                        </div>
                                    ) : (
                                        <div className="mt-12 p-8 bg-blue-50 rounded-2xl border border-blue-100">
                                            <h3 className="text-xl font-bold text-blue-900 mb-4">Want to distribute your own press release?</h3>
                                            <p className="text-blue-800 mb-6">
                                                DropPR.ai helps you craft professional, AI-powered press releases and distributes them to major news outlets worldwide.
                                            </p>
                                            <Link 
                                                href="/auth/register"
                                                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-md transition-all"
                                            >
                                                Get Started for Free
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Back Link */}
                        <div className="mt-12 text-center">
                            <Link 
                                href="/press-releases" 
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to all press releases
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function ArrowRight({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
