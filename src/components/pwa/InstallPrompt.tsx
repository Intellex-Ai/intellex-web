"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

function subscribeToDismissed(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDismissedSnapshot() {
  return sessionStorage.getItem("pwa-install-dismissed") === "true";
}

function getServerDismissedSnapshot() {
  return false;
}

export function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const isDismissedFromStorage = useSyncExternalStore(
    subscribeToDismissed,
    getDismissedSnapshot,
    getServerDismissedSnapshot
  );
  const [localDismissed, setLocalDismissed] = useState(false);
  const isDismissed = isDismissedFromStorage || localDismissed;

  useEffect(() => {
    if (isDismissed) return;

    if (isInstallable) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isDismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setLocalDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!isVisible || isDismissed || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-surface border border-white/10 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Smartphone size={24} className="text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">
              INSTALL_INTELLEX
            </h3>
            <p className="text-xs text-muted">
              Add to home screen for faster access and offline capabilities.
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-muted hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 px-4 border border-white/10 text-white font-mono text-xs uppercase 
                       hover:border-white/30 transition-colors"
          >
            NOT_NOW
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2 px-4 bg-primary text-black font-mono text-xs uppercase font-bold 
                       hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            <Download size={14} />
            INSTALL
          </button>
        </div>
      </div>
    </div>
  );
}
