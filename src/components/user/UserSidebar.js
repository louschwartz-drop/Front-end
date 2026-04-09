"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import userAuthStore from "../../store/userAuthStore";

export const USER_MENU_ITEMS = [
  {
    href: "/user/dashboard",
    label: "Dashboard",
    icon: (
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
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    href: "/user/dashboard/campaigns",
    label: "Campaigns",
    icon: (
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    href: "/user/dashboard/press-releases",
    label: "Press Releases",
    icon: (
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
    ),
  },
  {
    href: "/user/dashboard/payment-history",
    label: "Payment History",
    icon: (
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: "/user/dashboard/create",
    label: "Create Campaign",
    icon: (
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
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    href: "/user/dashboard/profile",
    label: "My Profile",
    icon: (
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export default function UserSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = userAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.push("/");
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

  const isActive = (href) => {
    if (href === "/user/dashboard") {
      return pathname === "/user/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - White Background */}
      <aside
        className={`
          lg:w-72 
          bg-white
          ${mobileMenuOpen ? "fixed inset-y-0 left-0 z-50 w-72" : "hidden lg:block"}
          flex flex-col
          shadow-xl
          h-screen
          border-r border-gray-200
          relative
        `}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-50"
          aria-label="Close sidebar"
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
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Top Section - Profile + Navigation Menu */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {/* Profile Section */}
            <Link href={"/user/dashboard/profile"}>
              <div className="flex-shrink-0 p-3 md:py-6 md:px-4 text-center border-b border-gray-200">
                {/* Avatar - Centered */}
                <div className="flex justify-center mb-3">
                  {mounted && user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-blue-500/20">
                      {mounted ? getInitials(user?.name) : "U"}
                    </div>
                  )}
                </div>

                {/* User Info - Vertical Stack */}
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-gray-900 truncate px-2">
                    {mounted ? (user?.name || "User") : "Loading..."}
                  </h3>
                  <p className="text-xs text-gray-500 truncate px-2">
                    {mounted ? (user?.email || "") : ""}
                  </p>
                </div>


              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="py-2 px-2 md:py-4">
              <div className="space-y-1">
                {USER_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                    flex items-center gap-x-3 py-2 px-4 rounded-lg
                    transition-all duration-300 ease-in-out
                    ${isActive(item.href)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                    group
                  `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span
                      className={`
                    flex-shrink-0 transition-transform duration-300
                    ${isActive(item.href) ? "" : "group-hover:scale-110"}
                  `}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Bottom Section - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200">
            {/* Support Section Header */}
            <div className="flex items-center gap-3 pl-6 pt-3">
              <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                Support
              </h4>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="space-y-1 pt-2">
              {/* Go to Website */}
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 duration-300 group"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
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
                <span className="text-[13px] font-medium">Go to Website</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0 text-gray-500"
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
                <span className="text-[13px] font-medium">Help</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
