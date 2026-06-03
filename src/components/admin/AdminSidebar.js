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
  Tag,
  LifeBuoy,
  UserCircle,
  MessageSquare,
  Headset,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  FolderOpen,
  List,
  Mail,
} from "lucide-react";

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
    href: "/admin/promo-codes",
    label: "Promo Codes",
    icon: Tag,
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
    href: "/admin/blogs",
    label: "Blogs",
    icon: FileText,
    subItems: [
      { href: "/admin/blogs", label: "All Posts", icon: List },
      { href: "/admin/blogs/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/blogs/create", label: "Create Post", icon: PlusCircle },
    ]
  },
  {
    href: "/admin/emails",
    label: "Email Campaigns",
    icon: Mail,
  },
  {
    href: "/admin/profile",
    label: "Profile",
    icon: UserCircle,
  },
];

import adminAuthStore from "@/store/adminAuthStore";
import Image from "next/image";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useAdminSocket } from "@/context/AdminSocketContext";
import { getAllSupportTicketsAdmin } from "@/lib/api/admin/chat.api";

function AdminSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = adminAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [waitingTicketIds, setWaitingTicketIds] = useState(new Set());
  const [expandedMenus, setExpandedMenus] = useState(["/admin/blogs"]); // Default blogs open
  const adminSocket = useAdminSocket();

  const toggleMenu = (href) => {
    setExpandedMenus(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  // Fetch initial unassigned open tickets on mount
  useEffect(() => {
    const fetchInitialWaitingTickets = async () => {
      try {
        const res = await getAllSupportTicketsAdmin();
        if (res.success && Array.isArray(res.data)) {
          const unassignedOpenIds = res.data
            .filter(t => t.status === "open" && !t.agentId)
            .map(t => t._id);
          setWaitingTicketIds(new Set(unassignedOpenIds));
        }
      } catch (err) {
        console.error("Failed to fetch initial support tickets for sidebar badge:", err);
      }
    };

    fetchInitialWaitingTickets();
  }, []);

  // Track real-time support requests
  useEffect(() => {
    if (!adminSocket) return;

    const onNewRequest = (ticket) => {
      if (ticket && ticket._id) {
        setWaitingTicketIds(prev => {
          const next = new Set(prev);
          next.add(ticket._id);
          return next;
        });
      }
    };

    const onListUpdate = (ticket) => {
      if (ticket && ticket._id) {
        setWaitingTicketIds(prev => {
          const next = new Set(prev);
          if (ticket.status !== "open" || ticket.agentId) {
            next.delete(ticket._id);
          } else {
            next.add(ticket._id);
          }
          return next;
        });
      }
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

  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
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
        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          <ul className="space-y-1 px-2">
            {ADMIN_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isLiveChat = item.href === "/admin/chat";
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.href);
              const active = isActive(item.href, hasSubItems);

              return (
                <li key={item.href} className="space-y-1">
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleMenu(item.href)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200 cursor-pointer group
                        ${active || isExpanded
                          ? "text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? "text-brand-blue" : "text-gray-400 group-hover:text-white"}`} />
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200 cursor-pointer group
                        ${active
                          ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {isLiveChat && waitingTicketIds.size > 0 && (
                        <span className="bg-yellow-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 animate-pulse">
                          {waitingTicketIds.size}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <ul className="mt-1 ml-4 border-l border-gray-800 space-y-1 py-1">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = isActive(sub.href, true);
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg ml-2
                                transition-all duration-200 cursor-pointer group
                                ${subActive
                                  ? "text-brand-blue font-bold"
                                  : "text-gray-400 hover:text-white"
                                }
                              `}
                            >
                              <SubIcon className={`w-4 h-4 shrink-0 ${subActive ? "text-brand-blue" : "text-gray-500 group-hover:text-white"}`} />
                              <span className="text-[13px]">{sub.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
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
