import React from 'react';
import clsx from 'clsx';


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftIcon && <span className="absolute left-3 text-muted pointer-events-none flex">{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={clsx(
                            'w-full h-12 bg-black/60 border-2 border-border rounded-none px-4 text-foreground font-mono text-sm transition-all duration-100 outline-none uppercase hover:border-primary hover:bg-[rgba(255,51,0,0.05)] focus:border-primary focus:bg-black/90 focus:shadow-[4px_4px_0_var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted',
                            leftIcon && 'pl-10',
                            error && 'border-error focus:shadow-[0_0_0_1px_var(--error)]'
                        )}
                        {...props}
                    />
                </div>
                {error && <span className="text-xs text-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
