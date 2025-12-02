"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<boolean>;
  updateApp: () => void;
}

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

function subscribeToDisplayMode(callback: () => void) {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getDisplayModeSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function getDisplayModeServerSnapshot() {
  return false;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isInstalled = useSyncExternalStore(subscribeToDisplayMode, getDisplayModeSnapshot, getDisplayModeServerSnapshot);
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineSnapshot, getServerSnapshot);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [appInstalled, setAppInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [installPrompt]);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }, [registration]);

  return {
    isInstallable: !!installPrompt && !isInstalled && !appInstalled,
    isInstalled: isInstalled || appInstalled,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp,
  };
}
