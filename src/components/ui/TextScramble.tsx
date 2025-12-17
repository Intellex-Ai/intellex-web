'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface TextScrambleProps {
    text: string;
    className?: string;
    duration?: number;
    delay?: number;
}

const IN_VIEW_THRESHOLD = 0.1;
const BLUR_RADIUS_PX = 8;
const BLUR_FILTER = `blur(${BLUR_RADIUS_PX}px)`;
const TRANSITION_EASE = [0.23, 1, 0.32, 1] as const;
const BLUR_TRANSITION_SECONDS = 0.3;
const OPACITY_TRANSITION_SECONDS = 0.15;
const PRESERVE_WHITESPACE_STYLE: React.CSSProperties = { whiteSpace: 'pre' };

export const TextScramble: React.FC<TextScrambleProps> = ({
    text,
    className,
    duration = 2000,
    delay = 0
}) => {
    const [visibleChars, setVisibleChars] = useState(0);
    const [isInView, setIsInView] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const { isLowEnd, prefersReducedMotion, level } = useDevicePerformance();

    // Skip animation for low-end devices or reduced motion preference
    const shouldAnimate = !isLowEnd && !prefersReducedMotion;

    // Use blur effect only on high-end devices
    const useBlur = level === 'high';

    useEffect(() => {
        if (!shouldAnimate) return;
        const rafId = requestAnimationFrame(() => setVisibleChars(0));
        return () => cancelAnimationFrame(rafId);
    }, [shouldAnimate, text]);

    useEffect(() => {
        if (!shouldAnimate) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isInView) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: IN_VIEW_THRESHOLD }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [isInView, shouldAnimate, text.length]);

    useEffect(() => {
        if (!shouldAnimate || !isInView) return;

        const totalChars = text.length;
        if (totalChars === 0) return;

        const charDelay = duration / totalChars;

        let currentChar = 0;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const timeoutId = setTimeout(() => {
            setVisibleChars(0);
            intervalId = setInterval(() => {
                currentChar += 1;
                setVisibleChars(currentChar);

                if (currentChar >= totalChars && intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }, charDelay);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [isInView, text, duration, delay, shouldAnimate]);

    // For low-end or reduced motion, render plain text immediately
    if (!shouldAnimate) {
        return (
            <span ref={elementRef} className={className} style={PRESERVE_WHITESPACE_STYLE}>
                {text}
            </span>
        );
    }

    const hasCompleted = visibleChars >= text.length;
    if (hasCompleted) {
        return (
            <span ref={elementRef} className={className} style={PRESERVE_WHITESPACE_STYLE}>
                {text}
            </span>
        );
    }

    const lastAnimatedIndex = visibleChars - 1;
    const perCharDelaySeconds = duration > 0 && text.length > 0 ? duration / text.length / 1000 : 0;
    const transitionSeconds = useBlur
        ? Math.min(BLUR_TRANSITION_SECONDS, perCharDelaySeconds || BLUR_TRANSITION_SECONDS)
        : OPACITY_TRANSITION_SECONDS;

    return (
        <span ref={elementRef} className={className} style={PRESERVE_WHITESPACE_STYLE}>
            {text.split('').map((char, index) => {
                const displayChar = char === ' ' ? '\u00A0' : char;

                if (index < lastAnimatedIndex) {
                    return (
                        <span key={`${char}-${index}`} style={{ display: 'inline-block', opacity: 1 }}>
                            {displayChar}
                        </span>
                    );
                }

                if (index === lastAnimatedIndex) {
                    return (
                        <motion.span
                            key={`${char}-${index}`}
                            initial={{
                                opacity: 0,
                                filter: useBlur ? BLUR_FILTER : 'none',
                            }}
                            animate={{
                                opacity: 1,
                                filter: 'none',
                            }}
                            transition={{
                                duration: transitionSeconds,
                                ease: TRANSITION_EASE,
                            }}
                            style={{
                                display: 'inline-block',
                                willChange: useBlur ? 'filter, opacity' : 'opacity'
                            }}
                        >
                            {displayChar}
                        </motion.span>
                    );
                }

                return (
                    <span key={`${char}-${index}`} style={{ display: 'inline-block', opacity: 0 }}>
                        {displayChar}
                    </span>
                );
            })}
        </span>
    );
};
