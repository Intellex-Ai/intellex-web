"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { useAuthSync } from '@/hooks/useAuthSync';
import { UserMenu } from '@/components/layout/UserMenu';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useStore();
    useAuthSync();

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
                        <UserMenu user={user} onLogout={logout} />
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
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="w-full"
                                            onClick={async () => {
                                                toggleMenu();
                                                try {
                                                    await logout();
                                                } catch (err) {
                                                    console.warn('Logout failed', err);
                                                }
                                            }}
                                        >
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
