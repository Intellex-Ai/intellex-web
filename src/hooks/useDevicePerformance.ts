'use client';

import { useEffect, useState } from 'react';

export type PerformanceLevel = 'high' | 'medium' | 'low';

interface DevicePerformance {
    level: PerformanceLevel;
    prefersReducedMotion: boolean;
    deviceMemory: number | null;
    hardwareConcurrency: number | null;
    isLowEnd: boolean;
    isMobile: boolean;
}

interface NavigatorWithMemory extends Navigator {
    deviceMemory?: number;
}

const getPerformanceLevel = (): DevicePerformance => {
    if (typeof window === 'undefined') {
        return {
            level: 'medium',
            prefersReducedMotion: false,
            deviceMemory: null,
            hardwareConcurrency: null,
            isLowEnd: false,
            isMobile: false,
        };
    }

    const nav = navigator as NavigatorWithMemory;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deviceMemory = nav.deviceMemory ?? null;
    const hardwareConcurrency = nav.hardwareConcurrency ?? null;
    
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || window.innerWidth < 768;

    // Calculate performance score
    let score = 100;

    // Reduced motion preference = treat as low-end for animations
    if (prefersReducedMotion) {
        score -= 50;
    }

    // Device memory check (in GB)
    if (deviceMemory !== null) {
        if (deviceMemory <= 2) score -= 40;
        else if (deviceMemory <= 4) score -= 20;
        else if (deviceMemory <= 8) score -= 5;
    }

    // CPU cores check
    if (hardwareConcurrency !== null) {
        if (hardwareConcurrency <= 2) score -= 30;
        else if (hardwareConcurrency <= 4) score -= 15;
        else if (hardwareConcurrency <= 6) score -= 5;
    }

    // Mobile penalty (usually less GPU power)
    if (isMobile) {
        score -= 15;
    }

    // Determine level
    let level: PerformanceLevel;
    if (score >= 70) {
        level = 'high';
    } else if (score >= 40) {
        level = 'medium';
    } else {
        level = 'low';
    }

    const isLowEnd = level === 'low' || prefersReducedMotion;

    return {
        level,
        prefersReducedMotion,
        deviceMemory,
        hardwareConcurrency,
        isLowEnd,
        isMobile,
    };
};

export function useDevicePerformance(): DevicePerformance {
    const [performance, setPerformance] = useState<DevicePerformance>(() => getPerformanceLevel());

    useEffect(() => {
        // Listen for reduced motion preference changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = () => setPerformance(getPerformanceLevel());
        
        mediaQuery.addEventListener('change', handleChange);
        
        // Also re-check on resize (for mobile detection)
        const handleResize = () => setPerformance(getPerformanceLevel());
        window.addEventListener('resize', handleResize);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return performance;
}

// Singleton for non-hook contexts
let cachedPerformance: DevicePerformance | null = null;

export function getDevicePerformance(): DevicePerformance {
    if (cachedPerformance === null) {
        cachedPerformance = getPerformanceLevel();
    }
    return cachedPerformance;
}
