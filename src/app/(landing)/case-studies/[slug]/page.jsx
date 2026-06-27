import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ShareMenu from "@/components/ui/ShareMenu"; 
import GetStartedButton from "../GetStartedButton";
import TableOfContents from "@/components/caseStudy/TableOfContents";

import { caseStudyService } from "@/lib/api/user/caseStudies";
import { format } from "date-fns";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await caseStudyService.getCaseStudyBySlug(slug);
    if (!res.success || !res.data) return { title: "Case Study Not Found - DropPR" };

    const study = res.data;
    return {
      title: study.metaTitle || `${study.title} - DropPR`,
      description: study.metaDescription || study.excerpt,
      keywords: study.metaKeywords,
      openGraph: {
        title: study.metaTitle || study.title,
        description: study.metaDescription || study.excerpt,
        images: study.featuredImage ? [study.featuredImage] : [],
      },
    };
  } catch (error) {
    return { title: "Case Study - DropPR" };
  }
}

export const dynamic = "force-dynamic";

export default async function CaseStudyDetail({ params }) {
  const { slug } = await params;
  let study = null;
  try {
    const res = await caseStudyService.getCaseStudyBySlug(slug);
    if (res.success && res.data) {
      study = res.data;
    } else {
      notFound();
    }
  } catch (error) {
    console.error("Error fetching case study details in page:", error);
    notFound();
  }

  return (
    <div className="min-h-screen pb-20 selection:bg-primary/10" style={{ background: "#fafaf7" }}>
      
      {/* Header Section (Split Layout) */}
      <div className="bg-[#F9F9F9] border-b border-gray-200 mb-12">
        <div className="max-w-[1360px] px-6 mx-auto py-12 md:py-20 lg:grid lg:grid-cols-12 gap-12 xl:gap-16 items-center">
          
          {/* Left: Featured Image */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-4 mb-8 lg:mb-0 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-gray-100">
              {study.featuredImage ? (
                <img 
                  src={study.featuredImage} 
                  alt={study.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Right: Content & Title */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight size={14} />
              <Link href="/case-studies" className="hover:text-primary transition-colors">Case Studies & Resources</Link>
              <ChevronRight size={14} />
            </div>

            {/* Title */}
            <h1 
              className="text-3xl md:text-4xl lg:text-[44px] leading-tight md:leading-[1.15] mb-8 font-bold"
              style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#0a0e1a", letterSpacing: "-0.02em" }}
            >
              {study.title}
            </h1>

            {/* Author / Date */}
            <div className="flex items-center gap-4 border-t border-gray-200 pt-6 mt-2">
              <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-gray-100">
                {study.authorImage ? (
                  <img src={study.authorImage} alt={study.authorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
                    {study.authorName?.split(' ').map(n => n[0]).join('') || 'A'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-900 font-bold" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>
                  Written by {study.authorName} {study.authorRole && <span className="text-gray-500 font-medium text-sm ml-1">· {study.authorRole}</span>}
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  {study.publishedAt ? format(new Date(study.publishedAt), "MMMM d, yyyy") : format(new Date(study.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1360px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Sidebar (Sticky Share/Table of contents) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <TableOfContents />
            
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Share Story</h3>
              <ShareMenu 
                  url={`/case-studies/${study.slug}`}
                  title={study.title}
                  text={study.title}
                  position="bottom-left"
                  showText={false}
              />
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="col-span-1 lg:col-span-8 xl:col-span-7">
          <div 
            className="prose prose-lg prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: study.content }}
          />

          {/* CTA At the bottom */}
          <div className="mt-16 bg-gradient-to-br from-[#0a0e1a] to-[#1a233a] rounded-2xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}>Ready for your own success story?</h3>
                <p className="text-gray-300 text-lg">Distribute your first press release with DropPR today.</p>
              </div>
              <GetStartedButton />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
