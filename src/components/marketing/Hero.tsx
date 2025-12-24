import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { TextScramble } from '@/components/ui/TextScramble';
import { createRevealStyle, REVEAL_CLASSNAME } from '@/lib/reveal';

export default function Hero() {
    const HERO_REVEAL_DELAYS = {
        badge: 0.05,
        title: 0.15,
        copy: 0.3,
        ctas: 0.4,
    };
    const TITLE_SCRAMBLE_DURATION_MS = 1500;
    const TITLE_PRIMARY_DELAY_MS = 0;
    const TITLE_SECONDARY_DELAY_MS = 500;

    return (
        <section className="relative min-h-screen flex items-center justify-center px-8 overflow-hidden md:px-4">
            <CinematicBackground />

            <div className="max-w-[1400px] w-full text-center flex flex-col items-center relative z-10 pt-20">
                <div
                    className={`${REVEAL_CLASSNAME} mb-8`}
                    style={createRevealStyle(HERO_REVEAL_DELAYS.badge)}
                >
                    <Badge variant="neutral" className="bg-surface/60 border-white/20 backdrop-blur">
                        <TextScramble
                            text="SYSTEM_READY"
                            className="font-mono text-primary text-xs tracking-wider leading-none"
                            deferUntilIdle
                        />
                        <ArrowRight size={12} className="text-primary ml-2" />
                    </Badge>
                </div>

                <h1
                    className={`${REVEAL_CLASSNAME} font-mono text-5xl md:text-6xl lg:text-8xl font-black leading-none mb-8 tracking-tighter uppercase text-white break-words max-w-5xl mx-auto`}
                    style={createRevealStyle(HERO_REVEAL_DELAYS.title)}
                >
                    <span className="block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,1)] md:[-webkit-text-stroke:2px_rgba(255,255,255,1)] mb-2 md:mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                        <TextScramble
                            text="INTELLIGENCE"
                            duration={TITLE_SCRAMBLE_DURATION_MS}
                            delay={TITLE_PRIMARY_DELAY_MS}
                            deferUntilIdle
                        />
                    </span>
                    <span className="text-white drop-shadow-[0_0_40px_rgba(255,77,0,0.8)] text-shadow-lg">
                        <TextScramble
                            text="GATHERING"
                            delay={TITLE_SECONDARY_DELAY_MS}
                            duration={TITLE_SCRAMBLE_DURATION_MS}
                            deferUntilIdle
                        />
                    </span>
                </h1>

                <p
                    className={`${REVEAL_CLASSNAME} text-muted text-base md:text-lg font-mono leading-relaxed max-w-2xl mx-auto mb-12`}
                    style={createRevealStyle(HERO_REVEAL_DELAYS.copy)}
                >
                    Advanced AI algorithms deployed. Automate workflows and unlock insights with enterprise-grade security.
                </p>

                <div
                    className={`${REVEAL_CLASSNAME} flex flex-col sm:flex-row gap-4 w-full sm:w-auto`}
                    style={createRevealStyle(HERO_REVEAL_DELAYS.ctas)}
                >
                    <Link href="/signup" className="w-full sm:w-auto">
                        <Button size="lg" rightIcon={<ArrowRight size={18} />} className="w-full sm:w-auto min-w-[200px]">
                            INITIALIZE
                        </Button>
                    </Link>
                    <Link href="#features" className="w-full sm:w-auto">
                        <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                            READ LOGS
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
