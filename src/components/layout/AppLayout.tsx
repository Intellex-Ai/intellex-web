'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
    LayoutDashboard,
    Folder,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface AppLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Folder, label: 'Projects', href: '/projects' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function AppLayout({ children }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="hidden md:flex h-[64px] px-6 items-center justify-between bg-background border-b border-border fixed top-0 left-0 right-0 z-50">
                <Link href="/dashboard" className="font-mono text-2xl font-black text-primary uppercase tracking-tighter whitespace-nowrap overflow-hidden transition-opacity duration-100">Intellex</Link>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={clsx(
                "w-[280px] bg-black/95 backdrop-blur-[10px] border-r-2 border-primary flex flex-col sticky top-0 h-screen transition-[width] duration-100 z-40 md:fixed md:-translate-x-full md:w-[260px]",
                !isSidebarOpen && "w-[80px]",
                isMobileMenuOpen && "md:translate-x-0"
            )}>
                <div className="h-[80px] flex items-center justify-between px-6 border-b-2 border-border">
                    <Link href="/dashboard" className={clsx("font-mono text-2xl font-black text-primary uppercase tracking-tighter whitespace-nowrap overflow-hidden transition-opacity duration-100", !isSidebarOpen && "opacity-0 w-0 pointer-events-none")}>
                        Intellex
                    </Link>
                    <button
                        className="bg-transparent border border-border text-muted cursor-pointer p-2 rounded-none transition-all duration-100 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary md:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                <nav className="flex-1 py-8 flex flex-col gap-0">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-4 px-8 py-4 text-muted rounded-none transition-all duration-100 whitespace-nowrap overflow-hidden border-l-2 border-transparent font-mono uppercase text-sm tracking-wider hover:bg-[rgba(255,51,0,0.1)] hover:text-foreground hover:border-border",
                                    isActive && "bg-primary text-black border-l-black font-bold"
                                )}
                            >
                                <item.icon size={20} />
                                <span className={clsx("font-normal transition-opacity duration-100", !isSidebarOpen && "opacity-0 w-0 pointer-events-none")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t-2 border-border flex flex-col gap-4 bg-black">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-none bg-surface-200 border border-border flex items-center justify-center text-primary shrink-0 font-mono font-bold">
                            <User size={16} />
                        </div>
                        <div className={clsx("flex flex-col whitespace-nowrap overflow-hidden", !isSidebarOpen && "opacity-0 w-0 pointer-events-none")}>
                            <span className="font-mono text-sm font-bold text-foreground uppercase">User</span>
                            <span className="font-mono text-xs text-muted">user@example.com</span>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="flex items-center gap-4 p-3 bg-transparent border border-border text-muted cursor-pointer transition-all duration-100 rounded-none font-mono uppercase text-xs justify-center hover:text-white hover:bg-error hover:border-error" title="Sign Out">
                        <LogOut size={20} />
                        <span className={clsx("font-normal transition-opacity duration-100", !isSidebarOpen && "opacity-0 w-0 pointer-events-none")}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 md:pt-[64px]">
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="hidden md:block fixed inset-0 bg-black/50 backdrop-blur-[4px] z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
