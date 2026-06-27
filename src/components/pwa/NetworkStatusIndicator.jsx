"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { toast } from "react-toastify";

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You are back online!", {
        icon: <Wifi className="text-green-500" />,
        toastId: "network-status",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are currently offline.", {
        icon: <WifiOff className="text-red-500" />,
        toastId: "network-status",
        autoClose: false,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // We rely on toast for the actual UI, so we don't need to render anything here.
  return null;
}
