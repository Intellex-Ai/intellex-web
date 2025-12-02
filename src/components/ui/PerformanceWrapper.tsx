'use client';

import React from 'react';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import clsx from 'clsx';

interface PerformanceWrapperProps {
    children: React.ReactNode;
    className?: string;
    /** Classes to apply on high-end devices */
    highEndClassName?: string;
    /** Classes to apply on low-end devices (replaces highEndClassName) */
    lowEndClassName?: string;
}

/**
 * Wrapper that applies different styles based on device performance.
 * Useful for replacing expensive effects like backdrop-blur with simpler alternatives.
 */
export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
    children,
    className,
    highEndClassName = '',
    lowEndClassName = '',
}) => {
    const { isLowEnd } = useDevicePerformance();

    return (
        <div className={clsx(className, isLowEnd ? lowEndClassName : highEndClassName)}>
            {children}
        </div>
    );
};

/**
 * Hook to get performance-aware class names
 */
export function usePerformanceClasses(
    highEndClasses: string,
    lowEndClasses: string
): string {
    const { isLowEnd } = useDevicePerformance();
    return isLowEnd ? lowEndClasses : highEndClasses;
}

/**
 * Replaces backdrop-blur classes with solid background alternatives
 */
export function useBlurClasses(blurClasses: string, fallbackClasses: string): string {
    const { isLowEnd } = useDevicePerformance();
    return isLowEnd ? fallbackClasses : blurClasses;
}
