'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'What is Drop PR and how does it work?',
      answer: 'Drop PR is an AI powered platform that turns your videos into published articles and press releases. Upload a video and our system transcribes it, extracts the key facts, and drafts a clean editorial article ready for distribution. The finished piece is then published across a network of more than 1,500 national and local media outlets, generating authoritative backlinks, search visibility, and permanent media coverage for your content.',
    },
    {
      question: 'How accurate is the AI transcription and article generation?',
      answer: 'Our AI transcription achieves 98%+ accuracy, and the generated articles are publication-ready with minimal editing required. The AI analyzes your video content, extracts key information, and creates professional press releases that are optimized for SEO and media distribution.',
    },
    {
      question: 'Which media outlets will my article be published to?',
      answer: 'Your articles are distributed across a network of more than 1,500 U.S. focused regional news sites. This includes stations and digital properties across ABC, FOX, NBC, and CBS affiliated networks, along with major national media networks such as USA Today and its partner sites. Content is published on real publisher hosted news platforms, not blogs. That structure improves Google indexation, creates durable backlinks, and increases visibility across both traditional search and leading AI platforms including ChatGPT, Gemini, Grok, Claude, and Perplexity.',
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
      answer: 'Yes, we take security seriously. Drop PR is GDPR, CCPA, and SOC 2 compliant with enterprise-grade security and end-to-end encryption. Your content is protected throughout the entire process.',
    },
    {
      question: 'Do I need to sign in with Google to use Drop PR?',
      answer: 'Yes, you need to sign in with Google to publish and generate your articles. This ensures secure authentication and allows you to manage your campaigns and track your published articles.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">
            Find answers to common questions about Drop PR
          </p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h3>
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

