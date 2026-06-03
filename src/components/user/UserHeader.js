"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import ConfirmationModal from "../ui/ConfirmationModal";
import FeedbackModal from "./FeedbackModal";
import userAuthStore from "@/store/userAuthStore";
import Tooltip from "@/components/ui/Tooltip";

export default function Header({ setMobileMenuOpen }) {
  const router = useRouter();
  const { user, logout } = userAuthStore();

  // Hooks are called unconditionally at the top
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setIsModalOpen(true);
  };
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true); // show spinner on button
    try {
      await logout(); // if logout is async
      router.push("/"); // navigate after logout
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setIsLoggingOut(false);
      setIsModalOpen(false);
    }
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 md:h-20 flex items-center justify-between px-4 lg:px-8">
        
        {/* Left Side: Logo */}
        <div className="flex items-center">
          <Link href={"/"} className="shrink-0 flex flex-col justify-center">
            <Image
              src="/logo.png"
              alt="DropPR.ai"
              width={140}
              height={42}
              className="h-9 md:h-12 w-auto object-contain"
              priority
            />
            <span className="text-[10px] text-slate-500 font-medium tracking-wide leading-none pl-1 mt-1">AI-Powered Press Releases</span>
          </Link>
        </div>

        {/* Right Side: Grouped Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Feedback Icon */}
          <Tooltip text="Submit your feedback" position="bottom">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 p-2 sm:px-4 sm:py-2.5 rounded-full sm:rounded-lg border border-gray-100 transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95 group"
            >
              <MessageSquare className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
              <span className="hidden sm:block ml-2 text-sm font-semibold">Provide Feedback</span>
            </button>
          </Tooltip>


          {/* Mobile Menu Button - Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100 transition-all duration-200 shadow-xs active:scale-95"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        isLoading={isLoggingOut}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        user={user}
      />
    </>
  );
}
