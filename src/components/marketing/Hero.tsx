'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CinematicBackground } from '@/components/ui/CinematicBackground';
import { TextScramble } from '@/components/ui/TextScramble';
import { motion } from 'framer-motion';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center px-8 overflow-hidden md:px-4">
            <CinematicBackground />

            <div className="max-w-[1400px] w-full text-center flex flex-col items-center relative z-10 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-8"
                >
                    <Badge variant="neutral" className="bg-surface/50 backdrop-blur border-white/20">
                        <TextScramble text="SYSTEM_READY" className="font-mono text-primary text-xs tracking-wider leading-none" />
                        <ArrowRight size={12} className="text-primary ml-2" />
                    </Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="font-mono text-5xl md:text-6xl lg:text-8xl font-black leading-none mb-8 tracking-tighter uppercase text-white break-words max-w-5xl mx-auto"
                >
                    <span className="block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,1)] md:[-webkit-text-stroke:2px_rgba(255,255,255,1)] mb-2 md:mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                        <TextScramble text="INTELLIGENCE" duration={1500} />
                    </span>
                    <span className="text-white drop-shadow-[0_0_40px_rgba(255,77,0,0.8)] text-shadow-lg">
                        <TextScramble text="GATHERING" delay={500} duration={1500} />
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="text-muted text-base md:text-lg font-mono leading-relaxed max-w-2xl mx-auto mb-12"
                >
                    Advanced AI algorithms deployed. Automate workflows and unlock insights with enterprise-grade security.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
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
                </motion.div>
            </div>
        </section>
    );
}
