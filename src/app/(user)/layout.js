"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import UserSidebar, { USER_MENU_ITEMS } from "@/components/user/UserSidebar";
import Header from "@/components/user/UserHeader";

export default function Layout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/user/dashboard") {
      return pathname === "/user/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed Full Height */}
      <UserSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Layout Container - Fixed positioning */}
      <div className="fixed top-0 bottom-0 left-0 lg:left-72 right-0 flex flex-col">
        {/* Header */}
        <Header setMobileMenuOpen={setMobileMenuOpen} />

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className=" min-h-full bg-white ">
            <div className="bg-white p-3 sm:p-6 ">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
