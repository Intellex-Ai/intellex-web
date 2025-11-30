"use client";

import type { ReactNode } from 'react';

export function Reveal({ children }: { children: ReactNode; delay?: number; className?: string }) {
    return <>{children}</>;
}
