"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/landingPage/LoginModal";

export default function GetStartedButton() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        onClick={() => setShowLoginPopup(true)}
        className="inline-block py-4 px-10 text-white font-black rounded-xl bg-primary hover:bg-primary/90 transition-colors shadow-lg cursor-pointer"
      >
        Get Started Now
      </button>
      <LoginModal
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onSuccess={() => {
          setShowLoginPopup(false);
          router.push("/user/dashboard/create");
        }}
      />
    </>
  );
}
