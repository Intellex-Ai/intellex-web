"use client";

import Link from 'next/link';
import { ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 relative overflow-hidden pt-20 pb-10">
            {/* Distinctive Background - Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-20 pointer-events-none" />

            {/* Massive Watermark */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none overflow-hidden">
                <h1 className="text-[15vw] md:text-[20vw] font-black text-white/[0.03] leading-none tracking-tighter whitespace-nowrap">
                    INTELLEX
                </h1>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="md:col-span-4 lg:col-span-5 flex flex-col justify-between">
                        <div>
                            <Link href="/" className="font-mono text-3xl font-black text-white uppercase tracking-tighter mb-6 block">
                                INTELLEX
                            </Link>
                            <p className="font-mono text-muted text-sm leading-relaxed uppercase max-w-xs mb-8">
                                NEXT_GEN_INTELLIGENCE.<br />
                                GATHER. ANALYZE. DEPLOY.<br />
                                BUILDING_THE_FUTURE_OF_DATA.
                            </p>

                            <div className="flex gap-4">
                                {[Github, Twitter, Linkedin].map((Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="w-10 h-10 flex items-center justify-center border border-white/10 text-muted hover:text-primary hover:border-primary hover:bg-primary/10 transition-all duration-300 bg-black"
                                    >
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="md:col-span-8 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {/* Product Column */}
                        <div>
                            <h4 className="font-mono text-sm font-black text-primary mb-6 uppercase tracking-wider">PRODUCT</h4>
                            <ul className="space-y-4">
                                {['Features', 'Pricing', 'Changelog', 'Docs'].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="font-mono text-muted text-sm uppercase hover:text-white transition-colors duration-200 flex items-center group"
                                        >
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-primary mr-0 group-hover:mr-2 transition-all duration-300" />
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div>
                            <h4 className="font-mono text-sm font-black text-white mb-6 uppercase tracking-wider">COMPANY</h4>
                            <ul className="space-y-4">
                                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                                    <li key={item}>
                                        <Link
                                            href="#"
                                            className="font-mono text-muted text-sm uppercase hover:text-white transition-colors duration-200 flex items-center group"
                                        >
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-primary mr-0 group-hover:mr-2 transition-all duration-300" />
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter Column */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <h4 className="font-mono text-sm font-black text-white mb-6 uppercase tracking-wider">STAY_UPDATED</h4>
                            <p className="font-mono text-xs text-muted mb-4 uppercase">
                                JOIN_THE_RESISTANCE.
                            </p>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="ENTER_EMAIL"
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:bg-black transition-all"
                                />
                                <Button className="w-full" variant="primary">
                                    SUBSCRIBE <ArrowRight size={14} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="font-mono text-muted text-xs uppercase">
                        © {new Date().getFullYear()} INTELLEX_INC.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="font-mono text-xs text-muted hover:text-white uppercase transition-colors">PRIVACY</Link>
                        <Link href="#" className="font-mono text-xs text-muted hover:text-white uppercase transition-colors">TERMS</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
