"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on home page as requested
    if (pathname !== "/") return;

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed recently (within 5 hours)
    const lastDismissed = localStorage.getItem("pwa_prompt_dismissed_at");
    if (lastDismissed) {
      const hoursSinceDismiss = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 5) return;
    }

    // Detect mobile
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipod/.test(userAgent) && !/ipad/.test(userAgent) && window.innerWidth <= 768;
    
    if (!isMobile) return;

    const isIOSDevice = /iphone|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice && !isStandalone) {
      // Show prompt for iOS after a slight delay
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isStandalone, pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed_at", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsVisible(false);
      localStorage.setItem("pwa_prompt_dismissed_at", Date.now().toString());
    }
    setDeferredPrompt(null);
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Install DropPR.ai App</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">For a faster, app-like experience.</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {isIOS ? (
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Tap the <span className="inline-block rounded border border-blue-200 bg-white px-1 shadow-sm mx-1">Share</span> button at the bottom of your screen, then select <strong>Add to Home Screen</strong>.
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 active:bg-blue-700"
          >
            Install Now
          </button>
        )}
      </div>
    </div>
  );
}
