import BlogListingClient from "./BlogListingClient";

export const metadata = {
  title: "DropPR.ai Blog | Latest AI PR Insights & Brand Strategy",
  description: "Explore the latest insights, tutorials, and strategy guides on how AI press release generation and distribution platforms are transforming public relations.",
  keywords: "AI PR blog, public relations AI tips, video to article syndication, media distribution strategy, online visibility",
  openGraph: {
    title: "DropPR.ai Blog | Latest AI PR Insights & Brand Strategy",
    description: "Explore the latest insights, tutorials, and strategy guides on how AI press release generation and distribution platforms are transforming public relations.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropPR.ai Blog | Latest AI PR Insights & Brand Strategy",
    description: "Explore the latest insights, tutorials, and strategy guides on how AI press release generation and distribution platforms are transforming public relations.",
    images: ["/logo.png"],
  },
};

export default function BlogListingPage() {
  return <BlogListingClient />;
}
