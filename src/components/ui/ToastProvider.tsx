'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
    id: string;
    title?: string;
    message: string;
    variant: ToastVariant;
    duration: number;
};

type ToastInput = Partial<Pick<Toast, 'id' | 'variant' | 'duration' | 'title'>> & {
    message: string;
};

type ToastContextValue = {
    toast: (input: ToastInput) => string;
    dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, ReactElement> = {
    success: <CheckCircle2 className="w-4 h-4" />,
    error: <AlertTriangle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
};

const resolveId = (incoming?: string) => {
    if (incoming) return incoming;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ToastCard: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const { variant, title, message } = toast;
    const palette = useMemo(() => {
        switch (variant) {
            case 'success':
                return 'border-success/60 bg-success/10 text-white';
            case 'error':
                return 'border-error/60 bg-error/10 text-white';
            default:
                return 'border-primary/60 bg-primary/10 text-white';
        }
    }, [variant]);

    return (
        <div className={clsx(
            'flex items-start gap-3 border px-4 py-3 shadow-lg backdrop-blur-sm',
            'w-full rounded-sm font-mono text-xs',
            palette,
        )}>
            <div className="mt-0.5">{ICONS[variant]}</div>
            <div className="flex-1 min-w-0">
                {title && <div className="uppercase tracking-wider text-[11px] mb-0.5">{title}</div>}
                <div className="text-white/90 leading-relaxed">{message}</div>
            </div>
            <button
                onClick={onDismiss}
                className="text-white/70 hover:text-white transition-colors text-sm"
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Record<string, number>>({});

    const dismiss = useCallback((id: string) => {
        if (timers.current[id]) {
            window.clearTimeout(timers.current[id]);
            delete timers.current[id];
        }
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback((input: ToastInput) => {
        const id = resolveId(input.id);
        const duration = input.duration ?? 4200;
        const variant: ToastVariant = input.variant ?? 'info';
        const next: Toast = {
            id,
            title: input.title,
            message: input.message,
            variant,
            duration,
        };
        setToasts((prev) => [...prev, next]);
        timers.current[id] = window.setTimeout(() => {
            dismiss(id);
            delete timers.current[id];
        }, duration);
        return id;
    }, [dismiss]);

    // Cleanup timers on unmount to avoid lingering callbacks.
    useEffect(() => {
        return () => {
            Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
            timers.current = {};
            setToasts([]);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ toast: pushToast, dismiss }}>
            {children}
            <div className="fixed bottom-4 left-4 right-4 sm:right-4 sm:left-auto z-[110] flex flex-col gap-3 max-w-md">
                {toasts.map((toast) => (
                    <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};
