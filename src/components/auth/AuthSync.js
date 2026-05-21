"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import userAuthStore from "@/store/userAuthStore";

/**
 * Optimized AuthSync that avoids hook order issues by using 
 * the stable Zustand .getState() API inside the effect.
 */
export default function AuthSync() {
  // Hook 1: NextAuth Session (Strictly order 1)
  const { data: session, status } = useSession();

  // Hook 2: Effect (Strictly order 2)
  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Access store non-reactively to prevent hook shifts
      const state = userAuthStore.getState();
      
      if (!state.isAuthenticated || !state.user) {
        state.setAuth(session.user, session.accessToken);
        // Force redirect to the main creation page after syncing session
        window.location.href = "/user/dashboard/create";
      }
    }
  }, [session, status]);

  return null;
}
