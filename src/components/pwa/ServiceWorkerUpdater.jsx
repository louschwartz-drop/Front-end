"use client";

import { useEffect } from "react";

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    // 1. Service Worker Registration & Auto-Update Logic
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Attempt an update check immediately on mount
          reg.update().catch(() => {
            // Ignore offline update errors
          });

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                // The new service worker is now active, reload the page to get the new assets
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }

    // 2. Global Chunk-Load-Error Handler
    // Catches users who have an old tab open during a new deployment
    const handleGlobalError = (event) => {
      const errorMsg = event.message || (event.error && event.error.message) || "";
      const isChunkError =
        errorMsg.includes("ChunkLoadError") ||
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("Failed to fetch dynamically imported module");

      if (isChunkError) {
        // Prevent infinite reload loops
        if (!sessionStorage.getItem("chunk_error_reloaded")) {
          console.warn("ChunkLoadError detected. Auto-reloading to fetch new chunks...");
          sessionStorage.setItem("chunk_error_reloaded", "true");
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleGlobalError);

    // Clear the flag after a short delay if the page successfully loads without errors.
    // This allows the error handler to work again on future deployments during the same session.
    const clearFlagTimeout = setTimeout(() => {
      sessionStorage.removeItem("chunk_error_reloaded");
    }, 5000);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      clearTimeout(clearFlagTimeout);
    };
  }, []);

  return null;
}
