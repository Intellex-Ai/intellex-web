"use client";

import type { ReactNode } from 'react';
import clsx from 'clsx';

import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';

const DEFAULT_DELAY = 0;
const PANEL_CLASSNAME = 'bg-black/50 border-white/10';

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
    return (
        <Reveal delay={delay}>
            <Card
                hoverEffect={hoverEffect}
                spotlight={spotlight}
                className={clsx(PANEL_CLASSNAME, className)}
            >
                {children}
            </Card>
        </Reveal>
    );
}
