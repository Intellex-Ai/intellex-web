'use client';

import React, { useRef, useState } from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    spotlight?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hoverEffect = false, spotlight = true, children, ...props }, ref) => {
        const divRef = useRef<HTMLDivElement>(null);
        const [position, setPosition] = useState({ x: 0, y: 0 });
        const [opacity, setOpacity] = useState(0);

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!divRef.current || !spotlight) return;

            const div = divRef.current;
            const rect = div.getBoundingClientRect();

            setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        };

        const handleMouseEnter = () => {
            if (spotlight) setOpacity(1);
        };

        const handleMouseLeave = () => {
            if (spotlight) setOpacity(0);
        };

        return (
            <div
                ref={ref || divRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={clsx(
                    'bg-surface border border-white/5 p-6 md:p-8 relative overflow-hidden group flex flex-col transition-all duration-300',
                    hoverEffect && 'hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(255,77,0,0.2)] hover:-translate-y-1',
                    className
                )}
                {...props}
            >
                {/* Spotlight Effect */}
                {spotlight && (
                    <div
                        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{
                            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,77,0,0.1), transparent 40%)`,
                        }}
                    />
                )}

                {/* Border Spotlight */}
                {spotlight && (
                    <div
                        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{
                            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,77,0,0.4), transparent 40%)`,
                            maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                            WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                            maskComposite: 'exclude',
                            WebkitMaskComposite: 'xor',
                            padding: '1px',
                        }}
                    />
                )}

                {/* Corner Accents - Subtle & Clean */}
                <div className={clsx("absolute w-1 h-1 bg-white/10 top-0 left-0 transition-colors duration-300", hoverEffect && "group-hover:bg-primary")} />
                <div className={clsx("absolute w-1 h-1 bg-white/10 top-0 right-0 transition-colors duration-300", hoverEffect && "group-hover:bg-primary")} />
                <div className={clsx("absolute w-1 h-1 bg-white/10 bottom-0 left-0 transition-colors duration-300", hoverEffect && "group-hover:bg-primary")} />
                <div className={clsx("absolute w-1 h-1 bg-white/10 bottom-0 right-0 transition-colors duration-300", hoverEffect && "group-hover:bg-primary")} />

                <div className="relative z-10 h-full flex flex-col">
                    {children}
                </div>
            </div>
        );
    }
);

Card.displayName = 'Card';
