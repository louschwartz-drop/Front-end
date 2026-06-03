'use client';

import { usePathname } from "next/navigation";
import ChatWidget from "./ChatWidget";
import userAuthStore from "@/store/userAuthStore";

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");
  const isDropprGPTPath = pathname?.includes("/droppr-gpt");
  const { isAuthenticated, user } = userAuthStore();

  if (isAdminPath || isDropprGPTPath) return null;

  // Force clean remount when authentication state changes
  const widgetKey = isAuthenticated ? `auth-${user?._id || user?.id || 'user'}` : 'guest';

  return <ChatWidget key={widgetKey} />;
}
