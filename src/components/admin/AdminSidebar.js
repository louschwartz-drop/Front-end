"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  User,
  FileText,
  Home,
  LogOut,
  X,
  Smartphone,
} from "lucide-react";
import adminAuthStore from "@/store/adminAuthStore";
import Image from "next/image";

export const ADMIN_MENU_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    icon: BarChart3,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: User,
  },
  {
    href: "/admin/profile",
    label: "Profile",
    icon: User,
  },
  // {
  //   href: "/admin/activity-logs",
  //   label: "Activity Logs",
  //   icon: FileText,
  // },
];

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = adminAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-auto
          w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
          h-screen
          overflow-hidden
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <Link
            href="/admin/dashboard"
            className="flex flex-col gap-1 cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center gap-1">
              <Image
                src="/drop-logo.png"
                alt="DropPR.ai"
                width={26}
                height={26}
                className=""
              />

              <span className="font-bold text-xl">DropPR.ai</span>
            </div>
            <span className="text-xs text-gray-400 ml-9">Admin Panel</span>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {ADMIN_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200 cursor-pointer
                      ${isActive(item.href)
                        ? "bg-brand-blue text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2 flex-shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Go to Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
