"use client";

import { SessionProvider } from "next-auth/react";
import AuthSync from "@/components/auth/AuthSync";

export default function NextAuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
