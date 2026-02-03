"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import userAuthStore from "@/store/userAuthStore";
import LoginModal from "../../components/landingPage/LoginModal";
import ConfirmationModal from "../ui/ConfirmationModal";
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated, user, logout } = userAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
    setDropdownOpen(false);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleLoginSuccess = () => {
    setShowLoginPopup(false);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => pathname === path;

  return (
    <>
      <header className="bg-white border-b border-neutral-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center hover:opacity-90 transition-opacity duration-200 cursor-pointer"
            >
              <Image
                src="/logo.png"
                alt="DropPR.ai"
                width={160}
                height={60}
                className="h-10 md:h-14 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative ${
                  isActive("/")
                    ? "text-brand-blue"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                Home
                {isActive("/") && (
                  <span className="absolute bottom-0 left-0 right-0 mx-2 h-0.5 bg-brand-blue"></span>
                )}
              </Link>
              <Link
                href="/contact"
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative ${
                  isActive("/contact")
                    ? "text-brand-blue"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                Contact Us
                {isActive("/contact") && (
                  <span className="absolute bottom-0 left-0  mx-2 right-0 h-0.5 bg-brand-blue"></span>
                )}
              </Link>
              <Link
                href="/faq"
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative ${
                  isActive("/faq")
                    ? "text-brand-blue"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                FAQs
                {isActive("/faq") && (
                  <span className="absolute bottom-0 left-0  mx-2 right-0 h-0.5 bg-brand-blue"></span>
                )}
              </Link>
              <Link
                href="/terms"
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative ${
                  isActive("/terms")
                    ? "text-brand-blue"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                Terms of Service
                {isActive("/terms") && (
                  <span className="absolute bottom-0 left-0  mx-2 right-0 h-0.5 bg-brand-blue"></span>
                )}
              </Link>
              <Link
                href="/privacy"
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative ${
                  isActive("/privacy")
                    ? "text-brand-blue"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                Privacy Policy
                {isActive("/privacy") && (
                  <span className="absolute bottom-0 left-0  mx-2 right-0 h-0.5 bg-brand-blue"></span>
                )}
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-brand-blue transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none "
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover "
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full  from-brand-blue to-blue-700 flex items-center justify-center text-primary font-semibold border-2 border-brand-blue">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-border py-2 z-50">
                      <Link
                        href="/user/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 border-b border-neutral-border hover:bg-blue-50 transition-colors"
                      >
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center text-white font-semibold border-2 border-brand-blue">
                            {getInitials(user?.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href="/user/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors"
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginPopup(true)}
                  className="bg-brand-blue text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200"
                >
                  Get Started Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black opacity-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden mobile-menu-container overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-border">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Close menu"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1 mb-6">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Home
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact Us
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    FAQs
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Terms of Service
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Privacy Policy
                  </Link>
                </nav>

                {/* User Section */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      href="/user/dashboard/create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-4 hover:bg-gray-100 transition-colors"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-brand-blue"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center text-white font-semibold border-2 border-brand-blue">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/user/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-brand-blue rounded-lg transition-colors"
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
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowLoginPopup(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue text-white rounded-lg transition-colors font-medium hover:bg-blue-700"
                    >
                      Get Started Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
      />

      {/* Login Popup */}
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
