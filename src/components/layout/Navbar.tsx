"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout, refreshUser } = useStore();
    const router = useRouter();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const menuVariants = {
        closed: {
            opacity: 0,
            x: "100%",
            transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 40
            }
        },
        open: {
            opacity: 1,
            x: 0,
            transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 40
            }
        }
    };

    useEffect(() => {
        // Hydrate user on initial load for marketing pages.
        refreshUser();
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                logout();
            }
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                refreshUser();
            }
            if (event === 'TOKEN_EXPIRED') {
                logout();
            }
        });
        return () => {
            sub?.subscription.unsubscribe();
        };
    }, [logout, refreshUser]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-[80px] flex items-center border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60">
            <div className="w-full m-0 px-4 lg:px-12 flex items-center justify-between h-full max-w-[1400px] mx-auto">
                <Link href="/" className="font-mono text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2 transition-opacity hover:opacity-80">
                    <span className="text-primary">{'///'}</span> INTELLEX
                </Link>

                {/* Desktop Links */}
                <div className="hidden lg:flex items-center gap-8 h-full">
                    {['Features', 'Pricing'].map((item) => (
                        <Link
                            key={item}
                            href={`/#${item.toLowerCase()}`}
                            className="relative font-mono text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest group"
                        >
                            {item.toUpperCase()}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}

                    {user ? (
                        <div className="relative">
                            <button
                                className="flex items-center gap-3 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 transition rounded-full"
                                onClick={() => setIsDropdownOpen((v) => !v)}
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                                    {user.avatarUrl ? (
                                        <Image src={user.avatarUrl} alt="avatar" width={32} height={32} className="object-cover" />
                                    ) : (
                                        <User size={16} />
                                    )}
                                </div>
                                <span className="font-mono text-sm uppercase tracking-wide hidden xl:inline">
                                    {user.name || user.email}
                                </span>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-black border border-white/10 shadow-lg py-2 z-50">
                                    {[
                                        { label: 'Profile', href: '/profile' },
                                        { label: 'Projects', href: '/projects' },
                                        { label: 'Settings', href: '/settings' },
                                    ].map((item) => (
                                        <button
                                            key={item.href}
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                router.push(item.href);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm font-mono text-white hover:bg-white/10"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm font-mono text-error hover:bg-error/10"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="font-mono text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
                                LOGIN
                            </Link>
                            <div className="pl-4 border-l border-white/10">
                                <Link href="/signup">
                                    <Button variant="primary" size="sm">GET STARTED</Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button className="lg:hidden block bg-none border-none text-white cursor-pointer z-[110] p-2 hover:text-primary transition-colors" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={menuVariants}
                            className="lg:hidden fixed top-0 left-0 w-screen h-screen bg-black z-[100] flex flex-col items-center justify-center p-8 border-l border-white/10"
                        >
                            <div className="flex flex-col gap-8 items-center w-full max-w-md">
                                <Link href="/#features" className="font-mono text-3xl font-black text-white uppercase tracking-wider hover:text-primary transition-colors" onClick={toggleMenu}>FEATURES</Link>
                                <Link href="/#pricing" className="font-mono text-3xl font-black text-white uppercase tracking-wider hover:text-primary transition-colors" onClick={toggleMenu}>PRICING</Link>
                                {user ? (
                                    <>
                                        <Link href="/dashboard" className="font-mono text-3xl font-black text-white uppercase tracking-wider hover:text-primary transition-colors" onClick={toggleMenu}>DASHBOARD</Link>
                                        <Button variant="secondary" size="lg" className="w-full" onClick={() => { logout(); toggleMenu(); }}>
                                            LOGOUT
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="font-mono text-3xl font-black text-white uppercase tracking-wider hover:text-primary transition-colors" onClick={toggleMenu}>LOGIN</Link>
                                        <Link href="/signup" className="w-full" onClick={toggleMenu}>
                                            <Button variant="primary" size="lg" className="w-full">GET STARTED</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
