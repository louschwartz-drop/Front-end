"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/landingPage/LoginModal";
import userAuthStore from "@/store/userAuthStore";

export default function PressReleaseCta() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();
    const { isAuthenticated } = userAuthStore();

    return (
        <>
            <section className="max-w-4xl mx-auto mt-8 px-6">
                <div className="bg-linear-to-r from-brand-dark to-brand-blue rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <h2 className="text-2xl md:text-4xl font-extrabold mb-4 md:mb-6 relative z-10">
                        Want to see your brand here?
                    </h2>
                    <p className="text-base md:text-lg text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto relative z-10">
                        Use DropPR.ai to turn your content into professional press releases and distribute them across our global media network.
                    </p>
                    <button 
                        onClick={() => {
                            if (isAuthenticated) {
                                router.push("/user/dashboard/create");
                            } else {
                                setShowLoginModal(true);
                            }
                        }}
                        className="inline-flex items-center gap-2 px-8 md:px-10 py-3 md:py-4 bg-white text-brand-dark font-bold rounded-xl hover:shadow-xl transition-all scale-100 hover:scale-105 relative z-10 cursor-pointer"
                    >
                        Start Publishing Now
                        <ArrowRightIcon className="w-5 h-4" />
                    </button>
                </div>
            </section>

            <LoginModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                onSuccess={() => {
                    setShowLoginModal(false);
                    router.push("/user/dashboard/create");
                }}
            />
        </>
    );
}

function ArrowRightIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
