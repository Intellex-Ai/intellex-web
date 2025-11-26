"use client";

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
        const buttonRef = useRef<HTMLButtonElement>(null);
        const [position, setPosition] = useState({ x: 0, y: 0 });

        const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            const x = (clientX - (left + width / 2)) * 0.2; // Magnetic strength
            const y = (clientY - (top + height / 2)) * 0.2;
            setPosition({ x, y });
        };

        const handleMouseLeave = () => {
            setPosition({ x: 0, y: 0 });
        };

        const variants = {
            primary: 'bg-primary text-white border border-primary shadow-sm hover:brightness-110 active:brightness-100',
            secondary: 'bg-transparent text-primary border border-primary/50 hover:border-primary hover:bg-primary/5 active:bg-primary/10',
            ghost: 'bg-transparent text-muted-foreground hover:text-white hover:bg-white/5',
            danger: 'bg-error/10 text-error border border-error hover:bg-error hover:text-white',
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base',
        };

        return (
            <motion.button
                ref={ref || buttonRef}
                className={clsx(
                    'font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || disabled}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                animate={{ x: position.x, y: position.y }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
                {...props as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
                {isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                {leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {rightIcon && <span className="ml-2">{rightIcon}</span>}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
