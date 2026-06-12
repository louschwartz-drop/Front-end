import FaqClient from "./FaqClient";
import Script from "next/script";

const faqs = [
  {
    question: 'What is DropPR and how does it work?',
    answer: 'DropPR is an AI-powered platform that turns your videos into published articles and press releases. Upload a video and our system transcribes it, extracts the key facts, and drafts a clean editorial article ready for distribution. The finished piece is then published across a network of more than 1,500 national and local media outlets, generating authoritative backlinks, search visibility, and permanent media coverage for your content.',
  },
  {
    question: 'How accurate is the AI transcription and article generation?',
    answer: 'Our AI transcription achieves 98%+ accuracy, and the generated articles are publication-ready with minimal editing required. The AI analyzes your video content, extracts key information, and creates professional press releases that are optimized for SEO and media distribution.',
  },
  {
    question: 'Which media outlets will my article be published to?',
    answer: 'Your articles are distributed across a network of more than 1,500 U.S. focused regional news sites. This includes stations and digital properties across ABC, FOX, NBC, and CBS affiliated networks, along with major national media networks such as USA Today and its partner sites. Content is published on real publisher-hosted news platforms, not blogs. That structure improves Google indexation, creates durable backlinks, and increases visibility across both traditional search and leading AI platforms including ChatGPT, Gemini, Grok, Claude, and Perplexity.',
  },
  {
    question: 'Can I edit my article before publishing?',
    answer: 'Yes, you have full control over your content. You can review, edit, and customize every article before publishing. Our platform allows you to use AI regeneration for specific sections or make manual edits to ensure the article meets your exact requirements.',
  },
  {
    question: 'How long does it take to process and publish an article?',
    answer: 'On average, the entire process from video upload to published article takes about 10 minutes. Our AI-powered pipeline processes content at unprecedented speed, transforming your video into a published article in minutes, not days.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and debit cards. All payments are processed securely through our encrypted payment gateway. You can choose from various pricing plans based on your publishing needs.',
  },
  {
    question: 'Is my content secure and private?',
    answer: 'Yes, we take security seriously. DropPR is GDPR, CCPA, and SOC 2 compliant with enterprise-grade security and end-to-end encryption. Your content is protected throughout the entire process.',
  },
  {
    question: 'Do I need to sign in with Google to use DropPR?',
    answer: 'Yes, you need to sign in with Google to publish and generate your articles. This ensures secure authentication and allows you to manage your campaigns and track your published articles.',
  },
];

export const metadata = {
  title: "Frequently Asked Questions | DropPR.ai - AI PR Platform Support",
  description: "Have questions about AI press release generation, media distribution networks, pricing, or how media placement feeds AI search results? Read our FAQs.",
  keywords: "DropPR.ai FAQ, AI press release help, video to article syndication, media distribution support, AI search engines visibility, SEO backlinks",
  openGraph: {
    title: "Frequently Asked Questions | DropPR.ai - AI PR Platform Support",
    description: "Have questions about AI press release generation, media distribution networks, pricing, or how media placement feeds AI search results? Read our FAQs.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | DropPR.ai - AI PR Platform Support",
    description: "Have questions about AI press release generation, media distribution networks, pricing, or how media placement feeds AI search results? Read our FAQs.",
    images: ["/logo.png"],
  },
};

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">
            Find answers to common questions about DropPR
          </p>

          <FaqClient faqs={faqs} />

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h2>
            <p className="text-gray-600 mb-4">
              Can't find the answer you're looking for? Please get in touch with our friendly team.
            </p>
            <a
              href="/contact"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
