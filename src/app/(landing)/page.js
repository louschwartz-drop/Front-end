"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import userAuthStore from "@/store/userAuthStore";
import LoginModal from "@/components/landingPage/LoginModal";
import Image from "next/image";

const rotatingMessages = [
  "Publisher-hosted articles, not blogs",
  "SEO indexing and backlink longevity",
  "Credible quotes and newsroom-style framing",
  "Distribution across local and national outlets",
  "Articles included in AI-powered search and discovery results",
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    company: "TechVlogs",
    rating: 5,
    text: "Drop PR has transformed how I scale my content. In just 6 months, I've distributed 45 press releases that generated over $180,000 in brand value. The AI-powered article generation saves me hours every week.",
    avatar: "👩‍💼",
  },
  {
    name: "Michael Rodriguez",
    role: "Marketing Director",
    company: "StartupX",
    rating: 5,
    text: "The distribution network is incredible. Our press releases consistently get picked up by major outlets like TechCrunch and Forbes. Drop PR has become essential to our PR strategy.",
    avatar: "👨‍💼",
  },
  {
    name: "Emma Thompson",
    role: "Brand Strategist",
    company: "Creative Agency",
    rating: 5,
    text: "What impressed me most is the accuracy of the AI transcription and article generation. The articles are publication-ready and require minimal editing. Highly recommended!",
    avatar: "👩‍🎨",
  },
];

export default function Home() {
  // const router = useRouter();
  // const isAuthenticated = () => {
  //   if (typeof window === "undefined") return false;
  //   return document.cookie.includes("auth_token=");
  // };
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    testimonialIntervalRef.current = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => {
      if (testimonialIntervalRef.current) {
        clearInterval(testimonialIntervalRef.current);
      }
    };
  }, []);
  const router = useRouter();
  const { isAuthenticated } = userAuthStore();
  const testimonialIntervalRef = useRef(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const handleDropprClick = () => {
    if (isAuthenticated) {
      router.push("/user/dashboard/create");
    } else {
      setShowLoginPopup(true);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
        <section className="relative min-h-[75vh] flex items-center justify-center overflow-x-hidden bg-linear-to-br from-primary via-brand-blue to-primary">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"
              animate={{
                x: [0, 50, 0],
                y: [0, -60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"
              animate={{
                x: [0, -30, 0],
                y: [0, 40, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 md:py-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2"
                  >
                    Turn Your Videos Into
                    <br />
                    Published
                    <br />
                    <span className="relative">
                      <span className="relative z-10">
                        Press Articles
                      </span>
                      <div className="absolute -bottom-4 left-0 w-full md:w-[120%] h-[3px] pointer-events-none">
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent blur-[2px]"
                        />
                        <motion.div
                          animate={{ scaleX: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-x-0 top-0 h-full bg-linear-to-r from-transparent via-white to-transparent shadow-[0_0_25px_rgba(255,255,255,1)]"
                        />
                      </div>
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-xl sm:text-2xl font-bold text-[#fcf9a6] mt-8 mb-6"
                  >
                    Plans starting at $99
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-xl sm:text-xl text-blue-100 mb-5 leading-relaxed"
                  >
                    Upload a video file or paste a link from YouTube, TikTok, Instagram, or your podcast. We turn it into a published article and distribute it across licensed media sites.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="h-16 sm:h-20 mb-8 flex items-center"
                  >
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentMessageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-lg sm:text-xl text-white/90 font-light italic"
                      >
                        {rotatingMessages[currentMessageIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <motion.button
                      onClick={handleDropprClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-primary font-bold text-lg sm:text-xl rounded-xl transition-all shadow-xl hover:shadow-2xl"
                    >
                      Amplify Your Content
                    </motion.button>
                    <motion.button
                      onClick={() => router.push("/faq")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 sm:px-12 py-4 sm:py-5 bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg sm:text-xl rounded-xl transition-all"
                    >
                      Learn More
                    </motion.button>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    className="text-sm text-blue-200 mt-2 font-medium"
                  >
                    No contracts · Plans starting at $99
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="relative w-full shadow-2xl rounded-2xl"
                >
                  <Image
                    src="/hero3.png"
                    alt="Content Publishing Dashboard"
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto' }}
                    className="rounded-2xl"
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-white py-16 relative overflow-x-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px]">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-gray-200 to-transparent" />
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3], scaleX: [0.9, 1.1, 0.9] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-linear-to-r from-transparent via-brand-blue/40 to-transparent blur-[3px]"
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto"
            >
              <p className="text-center text-sm font-semibold text-gray-600 mb-8 uppercase tracking-wider">
                Built for creators, founders, agencies, and growth teams
              </p>
              <div className="relative overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">
                  {[...Array(2)].map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-12 md:gap-16 px-8"
                    >
                      {[
                        "TechCrunch",
                        "Forbes",
                        "Business Insider",
                        "VentureBeat",
                        "Entrepreneur",
                        "Inc.",
                      ].map((logo, i) => (
                        <div
                          key={`${idx}-${i}`}
                          className="text-2xl font-bold text-gray-400 whitespace-nowrap"
                        >
                          {logo}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="w-full bg-linear-to-b from-white to-gray-50 py-20 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid md:grid-cols-4 grid-cols-2 gap-8 mb-20"
              >
                {[
                  { value: "1500+", label: "Media Outlets" },
                  { value: "99%", label: "AI Accuracy" },
                  { value: "10min", label: "Average Processing" },
                  { value: "24/7", label: "Distribution Support" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  Stop Renting Attention. Start Owning Authority.
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                  Social media algorithms are volatile, and post half-lives are shrinking to mere minutes. Drop PR turns your content into &ldquo;Performance PR.&rdquo; By distributing your videos as editorial articles on legacy media sites, you leverage &ldquo;borrowed authority&rdquo; to rank instantly on Google and secure your place as a trusted citation in AI models.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                {[
                  {
                    icon: "M13 10V3L4 14h7v7l9-11h-7z",
                    title: "Lightning Fast Distribution",
                    description:
                      "Get your content published across 1500+ media outlets in minutes, not weeks. Our automated pipeline ensures your press releases reach major publications like TechCrunch,",
                  },
                  {
                    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                    title: "AI-Powered Excellence",
                    description:
                      "Advanced AI handles transcription with 98%+ accuracy, intelligent analysis, and professional article generation automatically.",
                  },
                  {
                    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
                    title: "Global Distribution",
                    description:
                      "Publish to 1500+ top-tier national and local media outlets including, Yahoo!, AP, USA Today, TechCrunch, Forbes, and Business Insider. Reach audiences you never could before.",
                  },
                  {
                    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                    title: "Secure & Private",
                    description:
                      "Enterprise-grade security ensures your content is protected. GDPR, CCPA, and SOC 2 compliant with end-to-end encryption.",
                  },
                  {
                    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Easy Integration",
                    description:
                      "Seamlessly connect with YouTube, TikTok, Instagram, or upload directly. Works with your existing content workflow.",
                  },
                  {
                    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
                    title: "You stay in control",
                    description:
                      "You approve every article before distribution. We do not publish without your sign-off.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <motion.div
                      className="w-14 h-14 bg-linear-to-br from-primary to-brand-blue rounded-xl flex items-center justify-center mb-6"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <svg
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={feature.icon}
                        />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-linear-to-b from-gray-50 to-white py-20 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                  Transform your content into published articles in three simple
                  steps
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                {[
                  {
                    icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
                    title: "Drop Your Link",
                    description:
                      "Upload a video or paste a link from any major platform. Our system instantly pulls the key content and prepares it for editorial processing.",
                    step: "01",
                  },
                  {
                    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                    title: "AI Editorial Transformation",
                    description:
                      "Our AI extracts the facts and drafts a clean AP-style article built for publisher approval, search visibility, and AI discovery.",
                    step: "02",
                  },
                  {
                    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Publish and Distribute",
                    description:
                      "We publish the finished article across our media network and deliver live URLs you can share, cite, and promote.",
                    step: "03",
                  },
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="relative"
                  >
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                      <div className="relative inline-block mb-6">
                        <motion.div
                          className="w-16 h-16 bg-linear-to-br from-primary to-brand-blue rounded-xl flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={step.icon}
                            />
                          </svg>
                        </motion.div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          {step.step}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    {index < 2 && (
                      <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-linear-to-r from-brand-blue to-transparent transform -translate-x-1/2" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-primary py-20 relative overflow-x-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary via-brand-dark to-primary opacity-50"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
                  What Our Customers Say
                </h2>
                <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                  Join the creators and brands turning everyday content into real media coverage with Drop PR.
                </p>
              </motion.div>

              <div className="relative max-w-4xl mx-auto">
                <div className="relative h-[400px]">
                  <AnimatePresence mode="wait">
                    {testimonials.map((testimonial, index) => {
                      if (index !== currentTestimonialIndex) return null;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 100, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -100, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-white/10 backdrop-blur-sm p-8 md:p-10 rounded-2xl border border-white/20 shadow-2xl"
                        >
                          <div className="flex gap-1 mb-4">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-5 h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-white/90 mb-8 leading-relaxed italic text-lg md:text-xl">
                            "{testimonial.text}"
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
                              {testimonial.avatar}
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">
                                {testimonial.name}
                              </div>
                              <div className="text-blue-100 text-sm">
                                {testimonial.role}, {testimonial.company}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentTestimonialIndex(index);
                        if (testimonialIntervalRef.current) {
                          clearInterval(testimonialIntervalRef.current);
                        }
                        testimonialIntervalRef.current = setInterval(() => {
                          setCurrentTestimonialIndex(
                            (prev) => (prev + 1) % testimonials.length,
                          );
                        }, 5000);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${index === currentTestimonialIndex
                        ? "w-8 bg-white"
                        : "w-2 bg-white/40"
                        }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-linear-to-b from-white via-gray-50 to-white py-24 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  If you create content, you should publish it as press
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                  Two powerful use cases. One unstoppable distribution engine.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-linear-to-br from-primary to-brand-blue p-8 md:p-10 rounded-3xl text-white shadow-2xl"
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      For Creators & Affiliates: Evergreen Amplification
                    </h3>
                    <p className="text-blue-100 leading-relaxed text-lg">
                      Turn your product reviews and insights into high-DA citations. Replace disappearing social feeds with search-indexed media that drives traffic to your affiliate links for years. Turn audience momentum into authority.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/20">
                    <div className="text-4xl font-extrabold">10-15min</div>
                    <div className="text-blue-100">Average publish time</div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-white p-8 md:p-10 rounded-3xl border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-linear-to-br from-primary to-brand-blue rounded-2xl flex items-center justify-center mb-6">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      For Brands: Feed the LLMs
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      AI models like ChatGPT and Perplexity prioritize mentions from authoritative media outlets. Drop PR guarantees your brand and creator-led campaigns are surfaced in AI search results by embedding them in the trusted publisher data sets that LLMs rely on. Support product launches with indexed coverage that drives traffic.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                    <div className="text-4xl font-extrabold text-primary">
                      100%
                    </div>
                    <div className="text-gray-600">Secure & compliant</div>
                  </div>
                </motion.div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
                    title: "AI-Powered Intelligence",
                    description:
                      "Advanced AI transcription with 98%+ accuracy and smart content generation",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
                    title: "Multi-Platform Support",
                    description:
                      "Upload from YouTube, TikTok, Instagram, or directly from your device",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                    title: "Real-Time Analytics",
                    description:
                      "Track performance, views, and engagement across all distribution channels",
                    color: "from-green-500 to-emerald-500",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-primary transition-all shadow-lg hover:shadow-xl"
                  >
                    <div
                      className={`w-12 h-12 bg-linear-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={feature.icon}
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-linear-to-br from-primary to-brand-blue py-20 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
                  Ready to Share Your Story to the World
                </h2>
                <p className="text-lg sm:text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
                  Join creators and brands who are amplifying their content with Drop PR. Start publishing today and reach millions of readers worldwide.
                </p>
                <div className="flex flex-col items-center gap-2 mb-10 text-white font-medium text-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fast turnaround
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Transparent distribution
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={handleDropprClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-primary font-bold text-lg sm:text-xl rounded-xl transition-all shadow-xl hover:shadow-2xl"
                  >
                    Amplify Your Content
                  </motion.button>
                  <motion.button
                    onClick={() => router.push("/contact")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 sm:px-12 py-4 sm:py-5 bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg sm:text-xl rounded-xl transition-all"
                  >
                    Talk to Sales
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <LoginModal
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onSuccess={() => router.push("/user/dashboard/create")}
      />
    </>
  );
}
