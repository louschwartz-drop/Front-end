import Link from "next/link";

import { caseStudyService } from "@/lib/api/user/caseStudies";

export const metadata = {
  title: "Case Studies & Resources - DropPR",
  description: "Discover how DropPR press releases can help you achieve business success.",
};

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  let caseStudies = [];
  try {
    const res = await caseStudyService.getPublishedCaseStudies({ limit: 12 });
    if (res.success) {
      caseStudies = res.data;
    }
  } catch (error) {
    console.error("Failed to fetch case studies:", error);
  }

  return (
    <div className="min-h-screen pb-20 selection:bg-primary/10" style={{ background: "#fafaf7" }}>
      {/* Header Section with Background Image */}
      <div 
        className="relative py-24 md:py-32 px-6 flex items-center justify-center overflow-hidden"
      >
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2000")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gray-900/70 z-10" />
        
        <div className="relative z-20 max-w-4xl mx-auto text-center">
          <h1 
            className="text-4xl md:text-[56px] leading-tight md:leading-[72px] font-bold mb-6 text-white"
            style={{ fontFamily: "var(--font-serif, Georgia, serif)", letterSpacing: "-0.025em" }}
          >
            Press Release Case Studies
          </h1>
          <p className="text-lg md:text-xl text-gray-200 font-medium max-w-2xl mx-auto" style={{ fontFamily: "Charter, Georgia, serif" }}>
            Discover how DropPR helps businesses turn their videos into viral press releases and achieve massive media success.
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-[1360px] mx-auto px-6 md:px-8 mt-16 md:mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {caseStudies.length > 0 ? (
            caseStudies.map((study) => (
              <div key={study.slug} className="flex flex-col group h-full">
                {/* Card Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 mb-6 border border-gray-200">
                  {study.featuredImage ? (
                    <img 
                      src={study.featuredImage} 
                      alt={study.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col">
                  <h2 
                    className="text-xl md:text-2xl font-bold mb-4 group-hover:text-primary transition-colors"
                    style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#0a0e1a", lineHeight: 1.3 }}
                  >
                    {study.title}
                  </h2>
                  
                  <p className="text-sm md:text-base text-gray-600 mb-8 flex-1" style={{ lineHeight: 1.6 }}>
                    {study.excerpt}
                  </p>

                  {/* CTA Button */}
                  <Link href={`/case-studies/${study.slug}`} className="mt-auto self-start">
                    <span className="inline-block py-3 px-8 text-sm md:text-base text-white font-bold rounded bg-primary hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg">
                      Read Case Study
                    </span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <h3 className="text-xl font-bold text-gray-500">No case studies found.</h3>
              <p className="text-gray-400 mt-2">Check back later for new stories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
