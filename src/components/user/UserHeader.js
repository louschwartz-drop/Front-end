"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "../ui/ConfirmationModal";
import userAuthStore from "@/store/userAuthStore";

export default function Header({ setMobileMenuOpen }) {
  const router = useRouter();
  const { user, logout } = userAuthStore();

  // Hooks are called unconditionally at the top
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <header className="bg-white shadow-sm border-b border-gray-200 py-3 md:h-20  flex items-center justify-between p-1 lg:px-8">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-6 h-6 text-gray-700"
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

        {/* Logo - Desktop */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link href={"/"}>
            <Image
              src="/logo.png"
              alt="Drop PR"
              width={130}
              height={40}
              className="h-10 md:h-14 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Logo - Mobile */}
        <div className="lg:hidden absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <Link href={"/"}>
            <Image
              src="/logo.png"
              alt="Drop PR"
              width={130}
              height={40}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Logout Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center sm:space-x-2 bg-[#0A5CFF] hover:bg-[#3B82F6] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:block">Logout</span>
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
    </>
  );
}
