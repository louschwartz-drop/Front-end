'use client';

import { usePathname } from "next/navigation";
import ChatWidget from "./ChatWidget";

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");
  const isDropprGPTPath = pathname?.includes("/droppr-gpt");

  if (isAdminPath || isDropprGPTPath) return null;


  return <ChatWidget />;
}
