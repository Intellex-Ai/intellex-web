"use client";

import { RefreshCw } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function UpdatePrompt() {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-surface border border-primary/50 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <RefreshCw size={20} className="text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">
              UPDATE_AVAILABLE
            </h3>
            <p className="text-xs text-muted">
              A new version of Intellex is ready.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={updateApp}
            className="flex-1 py-2 px-4 bg-primary text-black font-mono text-xs uppercase font-bold 
                       hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            UPDATE_NOW
          </button>
        </div>
      </div>
    </div>
  );
}
