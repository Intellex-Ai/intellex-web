'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';

interface LazySectionProps {
    children: React.ReactNode;
    className?: string;
    /** Placeholder height while loading */
    minHeight?: string;
    /** Root margin for intersection observer */
    rootMargin?: string;
}

/**
 * Lazy loads children when they come into view.
 * Uses content-visibility for additional performance.
 */
export const LazySection: React.FC<LazySectionProps> = ({
    children,
    className,
    minHeight = '400px',
    rootMargin = '200px',
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Check if already in viewport on mount
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                minHeight: isVisible ? undefined : minHeight,
                contentVisibility: isVisible ? 'visible' : 'auto',
                containIntrinsicSize: isVisible ? undefined : `0 ${minHeight}`,
            }}
        >
            {isVisible ? (
                <Suspense fallback={<div style={{ minHeight }} />}>
                    {children}
                </Suspense>
            ) : (
                <div style={{ minHeight }} />
            )}
        </div>
    );
};
