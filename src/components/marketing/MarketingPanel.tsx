import type { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import { createRevealStyle, REVEAL_SCROLL_CLASSNAME, REVEAL_SCROLL_DATA_VALUE } from '@/lib/reveal';

const DEFAULT_DELAY = 0;
const PANEL_CLASSNAME = 'bg-black/50 border border-white/10 p-6 md:p-8 relative overflow-hidden group flex flex-col';
const PANEL_HOVER_CLASSNAME = 'transition-transform duration-300 hover:-translate-y-1 hover:border-primary/40';
const SPOTLIGHT_GLOW_CLASSNAME =
    'pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(600px_circle_at_center,rgba(255,77,0,0.12),transparent_45%)]';
const SPOTLIGHT_EDGE_CLASSNAME =
    'pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 border border-primary/30';

interface MarketingPanelProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    hoverEffect?: boolean;
    spotlight?: boolean;
}

const DEFAULT_HOVER_EFFECT = false;
const DEFAULT_SPOTLIGHT = false;

export function MarketingPanel({
    children,
    className,
    delay = DEFAULT_DELAY,
    hoverEffect = DEFAULT_HOVER_EFFECT,
    spotlight = DEFAULT_SPOTLIGHT,
}: MarketingPanelProps) {
    const panelClassName = twMerge(
        clsx(
            PANEL_CLASSNAME,
            hoverEffect && PANEL_HOVER_CLASSNAME,
            className
        )
    );

    return (
        <div
            className={REVEAL_SCROLL_CLASSNAME}
            style={createRevealStyle(delay)}
            data-reveal={REVEAL_SCROLL_DATA_VALUE}
        >
            <div className={panelClassName}>
                {spotlight && <div className={SPOTLIGHT_GLOW_CLASSNAME} />}
                {spotlight && <div className={SPOTLIGHT_EDGE_CLASSNAME} />}
                <div className="relative z-10 h-full flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
