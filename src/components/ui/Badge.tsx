import React from 'react';
import clsx from 'clsx';


interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'neutral', children, ...props }, ref) => {
        const variants = {
            neutral: 'bg-primary/10 text-primary border-primary shadow-[0_0_10px_rgba(255,51,0,0.2)]',
            success: 'bg-success/10 text-success border-success',
            warning: 'bg-warning/10 text-warning border-warning',
            error: 'bg-error/10 text-error border-error',
            info: 'bg-info/10 text-info border-info',
        };

        return (
            <span
                ref={ref}
                className={clsx(
                    'inline-flex items-center px-3 py-1 rounded-none text-xs font-bold leading-none whitespace-nowrap border font-mono uppercase tracking-wider',
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
