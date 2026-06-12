import HomeClient from "./HomeClient";

export const metadata = {
  title: "DropPR.ai | AI Press Release Generator & Media Distribution",
  description: "Convert videos and podcasts into professional AP-style articles. Distribute to 1,000+ media outlets to boost SEO and rank in AI search engine results.",
  keywords: "video to article generation, AI article generation, press release distribution, DropPR, PR platform, content publishing, SEO indexing, affiliate article publishing, brand authority builder, Generative Engine Optimization",
  openGraph: {
    title: "DropPR.ai | AI Press Release Generator & Media Distribution",
    description: "Convert videos and podcasts into professional AP-style articles. Distribute to 1,000+ media outlets to boost SEO and rank in AI search engine results.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropPR.ai | AI Press Release Generator & Media Distribution",
    description: "Convert videos and podcasts into professional AP-style articles. Distribute to 1,000+ media outlets to boost SEO and rank in AI search engine results.",
    images: ["/logo.png"],
  },
};

export default function Home() {
  return <HomeClient />;
}
