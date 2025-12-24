"use client";

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const DEFAULT_DELAY = 0;
const REVEAL_OFFSET = 28;
const REVEAL_DURATION = 0.9;
const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VIEWPORT_MARGIN = '-10% 0px';

interface RevealProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function Reveal({ children, delay = DEFAULT_DELAY, className }: RevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: VIEWPORT_MARGIN });
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <div ref={containerRef} className={className}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            className={className}
            initial={{ opacity: 0, y: REVEAL_OFFSET }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_OFFSET }}
            transition={{ duration: REVEAL_DURATION, ease: REVEAL_EASE, delay }}
        >
            {children}
        </motion.div>
    );
}
