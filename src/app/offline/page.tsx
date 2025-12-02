"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-white/10 bg-surface p-8">
          <div className="w-20 h-20 mx-auto mb-6 border border-primary/50 flex items-center justify-center">
            <WifiOff size={40} className="text-primary" />
          </div>
          
          <h1 className="font-mono text-2xl font-black text-white mb-2 uppercase tracking-wider">
            OFFLINE_MODE
          </h1>
          
          <div className="h-px bg-white/10 my-4" />
          
          <p className="text-muted mb-6 font-mono text-sm">
            CONNECTION_LOST // UNABLE TO REACH INTELLEX SERVERS
          </p>
          
          <p className="text-muted-foreground mb-8 text-sm">
            Check your internet connection and try again. Some features may be available offline.
          </p>
          
          <button
            onClick={handleRetry}
            className="w-full py-3 px-6 bg-primary text-black font-mono font-bold uppercase tracking-wider 
                       hover:bg-primary-hover transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            RETRY_CONNECTION
          </button>
          
          <div className="mt-8 pt-4 border-t border-white/10">
            <p className="text-xs text-muted font-mono">
              INTELLEX PWA v1.0 // OFFLINE CAPABLE
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary/50" />
          <div className="w-2 h-2 bg-primary/30" />
          <div className="w-2 h-2 bg-primary/10" />
        </div>
      </div>
    </div>
  );
}
