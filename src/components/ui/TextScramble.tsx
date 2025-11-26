'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

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
    const [visibleChars, setVisibleChars] = useState(0);
    const [isInView, setIsInView] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
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
    }, [isInView]);

    useEffect(() => {
        if (!isInView) return;

        const totalChars = text.length;
        const charDelay = duration / totalChars;

        const timeout = setTimeout(() => {
            let currentChar = 0;
            const interval = setInterval(() => {
                currentChar++;
                setVisibleChars(currentChar);

                if (currentChar >= totalChars) {
                    clearInterval(interval);
                }
            }, charDelay);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [isInView, text, duration, delay]);

    return (
        <span ref={elementRef} className={className}>
            {text.split('').map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    animate={
                        index < visibleChars
                            ? { opacity: 1, filter: 'blur(0px)' }
                            : { opacity: 0, filter: 'blur(8px)' }
                    }
                    transition={{
                        duration: 0.3,
                        ease: [0.23, 1, 0.32, 1],
                    }}
                    style={{ display: 'inline-block' }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </span>
    );
};
