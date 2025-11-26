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
                "group inline-flex items-center gap-2 text-muted hover:text-primary transition-colors font-mono text-xs uppercase tracking-wider",
                className
            )}
        >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{label}</span>
        </Link>
    );
}
