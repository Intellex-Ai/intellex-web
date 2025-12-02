"use client";

import { useEffect } from "react";
import { InstallPrompt } from "./InstallPrompt";
import { UpdatePrompt } from "./UpdatePrompt";
import { OfflineIndicator } from "./OfflineIndicator";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
