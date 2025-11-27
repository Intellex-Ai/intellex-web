"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
    className?: string;
    href?: string;
    label?: string;
}

export function BackButton({ className, href = "/", label = "Back to Home" }: BackButtonProps) {
    return (
        <Link
            href={href}
            className={cn(
                "group inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 font-mono text-xs uppercase tracking-widest",
                className
            )}
        >
            <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
            </div>
            <span className="relative overflow-hidden">
                {label}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </span>
        </Link>
    );
}
