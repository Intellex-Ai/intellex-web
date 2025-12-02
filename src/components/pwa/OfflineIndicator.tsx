"use client";

import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 text-black py-2 px-4">
      <div className="flex items-center justify-center gap-2 text-sm font-mono font-bold">
        <WifiOff size={16} />
        <span>OFFLINE_MODE // LIMITED FUNCTIONALITY</span>
      </div>
    </div>
  );
}
