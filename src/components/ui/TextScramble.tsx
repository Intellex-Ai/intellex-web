'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

interface TextScrambleProps {
    text: string;
    className?: string;
    duration?: number;
    delay?: number;
}

export const TextScramble: React.FC<TextScrambleProps> = ({
    text,
    className,
    duration = 2000,
    delay = 0
}) => {
    const [displayText, setDisplayText] = useState('');
    const [isInView, setIsInView] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const { isLowEnd, prefersReducedMotion } = useDevicePerformance();

    // For low-end devices or reduced motion, show text immediately
    const shouldAnimate = useMemo(() => !isLowEnd && !prefersReducedMotion, [isLowEnd, prefersReducedMotion]);

    useEffect(() => {
        if (!shouldAnimate) {
            setDisplayText(text);
            setIsComplete(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isInView) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [isInView, shouldAnimate, text]);

    useEffect(() => {
        if (!shouldAnimate || !isInView) return;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
        const totalChars = text.length;
        const charRevealTime = duration / totalChars;
        let currentIndex = 0;
        let scrambleInterval: NodeJS.Timeout;
        let revealTimeout: NodeJS.Timeout;

        const startAnimation = () => {
            // Scramble effect - update random characters
            scrambleInterval = setInterval(() => {
                let result = '';
                for (let i = 0; i < totalChars; i++) {
                    if (i < currentIndex) {
                        result += text[i];
                    } else {
                        result += chars[Math.floor(Math.random() * chars.length)];
                    }
                }
                setDisplayText(result);
            }, 50); // Update scramble every 50ms

            // Reveal characters one by one
            const revealNext = () => {
                if (currentIndex >= totalChars) {
                    clearInterval(scrambleInterval);
                    setDisplayText(text);
                    setIsComplete(true);
                    return;
                }
                currentIndex++;
                revealTimeout = setTimeout(revealNext, charRevealTime);
            };

            revealTimeout = setTimeout(revealNext, charRevealTime);
        };

        const delayTimeout = setTimeout(startAnimation, delay);

        return () => {
            clearTimeout(delayTimeout);
            clearTimeout(revealTimeout);
            clearInterval(scrambleInterval);
        };
    }, [isInView, text, duration, delay, shouldAnimate]);

    // For reduced motion or low-end, render plain text
    if (!shouldAnimate || isComplete) {
        return (
            <span ref={elementRef} className={className}>
                {text}
            </span>
        );
    }

    return (
        <span 
            ref={elementRef} 
            className={className}
            style={{ 
                display: 'inline-block',
                minWidth: `${text.length}ch`,
            }}
        >
            {displayText || text.replace(/./g, '_')}
        </span>
    );
};
