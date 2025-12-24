"use client";

import { BackButton } from '@/components/ui/BackButton';
import { Reveal } from '@/components/ui/Reveal';

interface PageHeaderProps {
    title: string;
    description: string;
    badge?: string;
}

const HEADER_REVEAL_DELAYS = {
    badge: 0,
    title: 0.1,
    description: 0.2,
};

export default function PageHeader({ title, description, badge }: PageHeaderProps) {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
            {/* Background - Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-20 pointer-events-none" />

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
                <div className="absolute top-0 left-6 md:left-0">
                    <BackButton />
                </div>

                {badge && (
                    <Reveal delay={HEADER_REVEAL_DELAYS.badge}>
                        <div className="inline-block mb-6 px-3 py-1 border border-primary/30 bg-primary/10 rounded-full">
                            <span className="font-mono text-xs text-primary uppercase tracking-wider">{badge}</span>
                        </div>
                    </Reveal>
                )}

                <Reveal delay={HEADER_REVEAL_DELAYS.title}>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase">
                        {title}
                    </h1>
                </Reveal>

                <Reveal delay={HEADER_REVEAL_DELAYS.description}>
                    <p className="text-lg md:text-xl text-muted font-mono uppercase leading-relaxed max-w-2xl mx-auto">
                        {description}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
