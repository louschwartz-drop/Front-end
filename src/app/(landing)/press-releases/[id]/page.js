import PressReleaseDetailClient from "./PressReleaseDetailClient";
import Script from "next/script";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function getArticle(id) {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return null;
    }
    try {
        const res = await fetch(`${BASE_URL}/public/press-releases/${id}`, {
            next: { revalidate: 60 } // Cache press releases for 60 seconds
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (json?.success && json?.data) {
            const c = json.data;
            return {
                id: c._id,
                title: c.article?.headline || "",
                summary: c.article?.summary || "",
                body: c.article?.body || "",
                conclusion: c.article?.conclusion || "",
                creatorQuote: c.article?.creatorQuote || "",
                introduction: c.article?.introduction || "",
                category: c.article?.productSummary?.category || "",
                categories: c.article?.categories || "",
                useCase: c.article?.productSummary?.useCase || "",
                positioning: c.article?.productSummary?.positioning || "",
                image: c.productCard?.thumbnail || "",
                productName: c.productCard?.productName || "",
                authorName: c.productCard?.authorName || c.userId?.name || "DropPR Author",
                affiliateLink: c.productCard?.affiliateLink || "",
                sourceVideoLink: c.productCard?.sourceVideoLink || "",
                videoSource: c.videoSource || "",
                published: c.createdAt || "",
            };
        }
        return null;
    } catch (e) {
        console.error("Server Fetch Error (Article):", e);
        return null;
    }
}

async function getRelated(id) {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return [];
    }
    try {
        const res = await fetch(`${BASE_URL}/public/press-releases/${id}/related?limit=3`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return [];
        const json = await res.json();
        if (json?.success) return json.data || [];
        return [];
    } catch (e) {
        console.error("Server Fetch Error (Related):", e);
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        return {
            title: "Press Release Not Found | DropPR.ai",
            description: "The requested press release could not be found or has been removed.",
        };
    }

    return {
        title: `${article.title} | DropPR.ai Newsroom`,
        description: article.summary || `Read this press release published by ${article.authorName} on DropPR.ai.`,
        openGraph: {
            title: article.title,
            description: article.summary || `Read this press release published by ${article.authorName} on DropPR.ai.`,
            type: "article",
            images: article.image ? [article.image] : [],
            publishedTime: article.published,
            authors: [article.authorName],
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.summary,
            images: article.image ? [article.image] : [],
        },
    };
}

export default async function PressReleaseDetailPage({ params }) {
    const { id } = await params;
    const [article, related] = await Promise.all([
        getArticle(id),
        getRelated(id)
    ]);

    let newsSchema = null;
    if (article) {
        newsSchema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.summary || undefined,
            "image": article.image || undefined,
            "datePublished": article.published || undefined,
            "author": {
                "@type": "Person",
                "name": article.authorName,
            },
            "publisher": {
                "@type": "Organization",
                "name": "DropPR.ai",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.droppr.ai/logo.png"
                }
            },
            "articleBody": article.body
        };
    }

    return (
        <>
            {newsSchema && (
                <Script
                    id="press-release-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }}
                />
            )}
            <PressReleaseDetailClient article={article} related={related} />
        </>
    );
}
