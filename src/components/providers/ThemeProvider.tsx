'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'intellex:theme';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Start with stable defaults to avoid SSR/client mismatches; hydrate actual preference after mount.
    const [theme, setThemeState] = useState<Theme>('dark');
    const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => getSystemTheme());
    const lastApplied = useRef<'dark' | 'light' | null>(null);
    const hydrated = useRef(false);

    const resolvedTheme = useMemo(() => (theme === 'system' ? systemTheme : theme), [theme, systemTheme]);

    const enableSmoothTransition = () => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.classList.add('theme-transition');
        window.setTimeout(() => root.classList.remove('theme-transition'), 320);
    };

    // Hydrate stored preference and current system theme once on mount.
    useIsomorphicLayoutEffect(() => {
        const stored = getStoredTheme();
        if (stored !== theme) {
            setThemeState(stored);
        }
        const currentSystem = getSystemTheme();
        if (currentSystem !== systemTheme) {
            setSystemTheme(currentSystem);
        }
        hydrated.current = true;
    }, []);

    // Apply theme class to document and resolve system theme before paint to avoid flicker.
    useIsomorphicLayoutEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;

        if (lastApplied.current !== resolvedTheme) {
            if (resolvedTheme === 'light') {
                root.classList.add('light');
            } else {
                root.classList.remove('light');
            }
            root.style.colorScheme = resolvedTheme;
            lastApplied.current = resolvedTheme;
        }
    }, [resolvedTheme]);

    // Cleanup when this provider unmounts (e.g., navigating to marketing pages) to keep theme scoped to app shell.
    useEffect(() => {
        return () => {
            if (typeof document === 'undefined') return;
            const root = document.documentElement;
            root.classList.remove('light', 'theme-transition');
            root.style.colorScheme = 'dark';
            lastApplied.current = null;
        };
    }, []);

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (theme !== 'system' || typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (hydrated.current) {
                enableSmoothTransition();
            }
            setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        if (hydrated.current) {
            enableSmoothTransition();
        }
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
