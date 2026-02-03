"use client";

import { useCallback, useMemo, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import adminAuthStore from "@/store/adminAuthStore";
import { ADMIN_MENU_ITEMS } from "./AdminSidebar";

const AdminHeader = memo(function AdminHeader({ setMobileMenuOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin: user, logout } = adminAuthStore();

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const getInitials = useCallback((name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const isActive = useCallback(
    (href) => {
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname],
  );

  const currentPageTitle = useMemo(() => {
    return (
      ADMIN_MENU_ITEMS.find((item) => isActive(item.href))?.label ||
      "Admin Dashboard"
    );
  }, [isActive]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200 flex-shrink-0 w-full">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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

          {/* Page Title - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              {currentPageTitle}
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#0A5CFF]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0A5CFF] flex items-center justify-center text-white font-semibold border-2 border-[#0A5CFF]">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500">{user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 cursor-pointer"
              title="Logout"
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
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

AdminHeader.displayName = "AdminHeader";

export default AdminHeader;
