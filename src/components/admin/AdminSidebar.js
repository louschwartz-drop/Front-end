"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  User,
  FileText,
  Home,
  LogOut,
  X,
  CreditCard,
  LifeBuoy,
  UserCircle,
  MessageSquare,
  Headset,
} from "lucide-react";
import adminAuthStore from "@/store/adminAuthStore";
import Image from "next/image";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useAdminSocket } from "@/context/AdminSocketContext";

export const ADMIN_MENU_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/campaigns",
    label: "Campaigns",
    icon: BarChart3,
  },
  {
    href: "/admin/press-releases",
    label: "Press Releases",
    icon: FileText,
  },
  {
    href: "/admin/pricing",
    label: "Pricing Plans",
    icon: CreditCard,
  },
  {
    href: "/admin/support",
    label: "Contact Queries",
    icon: LifeBuoy,
  },
  {
    href: "/admin/feedback",
    label: "User Feedback",
    icon: MessageSquare,
  },
  {
    href: "/admin/chat",
    label: "Live Chat",
    icon: Headset,
  },

  {
    href: "/admin/profile",
    label: "Profile",
    icon: UserCircle,
  },
];

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = adminAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const adminSocket = useAdminSocket();

  // Track real-time waiting-agent requests
  useEffect(() => {
    if (!adminSocket) return;

    const onNewRequest = () => setWaitingCount((n) => n + 1);
    const onListUpdate = (chat) => {
      if (chat.status !== "WAITING") setWaitingCount((n) => Math.max(0, n - 1));
    };

    adminSocket.on("new_support_request", onNewRequest);
    adminSocket.on("chat_list_update", onListUpdate);

    return () => {
      adminSocket.off("new_support_request", onNewRequest);
      adminSocket.off("chat_list_update", onListUpdate);
    };
  }, [adminSocket]);

  const handleLogoutClick = useCallback(() => {
    setIsModalOpen(true);
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    }
  }, [setMobileMenuOpen]);

  const handleConfirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setIsLoggingOut(false);
      setIsModalOpen(false);
    }
  }, [logout, router]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

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
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
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
              const isLiveChat = item.href === "/admin/chat";
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
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {isLiveChat && waitingCount > 0 && (
                      <span className="bg-yellow-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 animate-pulse">
                        {waitingCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Go to Website</span>
          </Link>
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        title="Admin Logout"
        message="Are you sure you want to log out of the admin panel?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        isLoading={isLoggingOut}
      />
    </>
  );
}

export default AdminSidebar;
