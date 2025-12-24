import type { ReactNode } from 'react';

interface LazySectionProps {
    children: ReactNode;
    className?: string;
    /** Placeholder height while loading */
    minHeight?: string;
}

/**
 * Uses content-visibility to defer rendering work until the section is near viewport.
 */
export function LazySection({
    children,
    className,
    minHeight = '400px',
}: LazySectionProps) {
    return (
        <div
            className={className}
            style={{
                minHeight,
                contentVisibility: 'auto',
                containIntrinsicSize: `0 ${minHeight}`,
            }}
        >
            {children}
        </div>
    );
}
