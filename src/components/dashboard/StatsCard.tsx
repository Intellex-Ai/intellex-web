import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';


interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, trend, delay = 0 }) => {
    return (
        <div
            className="p-6 flex flex-col justify-between h-full animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards border-l-2 border-primary/20 hover:border-primary bg-white/5 transition-colors duration-300"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="text-primary/50 group-hover:text-primary transition-colors duration-300">
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={clsx(
                        "text-xs font-mono font-bold px-2 py-1 rounded-none",
                        trend.isPositive
                            ? "text-success bg-success/10"
                            : "text-error bg-error/10"
                    )}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-4xl font-mono font-bold text-white mb-1 tracking-tighter">
                    {value}
                </h3>
                <p className="text-xs text-muted font-mono uppercase tracking-wider">
                    {label}
                </p>
            </div>
        </div>
    );
};
