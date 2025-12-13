'use client';

import { useStore } from '@/store';

import { useEffect, useState } from 'react';
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
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';
import { DigitalClock } from '@/components/ui/DigitalClock';
import { useAuthSync } from '@/hooks/useAuthSync';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface AppLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Folder, label: 'Projects', href: '/projects' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function AppLayout({ children }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, clearSession, timezone, isHydrated } = useStore();
    const [isSigningOut, setIsSigningOut] = useState(false);
    useAuthSync();
    useRealtimeUpdates();

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await logout();
            clearSession();
            router.push('/');
        } finally {
            setIsSigningOut(false);
        }
    };

    useEffect(() => {
        // Only redirect after hydration to avoid flash redirects on page load
        // When session expires or is cleared by auth sync, send user home.
        if (isHydrated && !user) {
            router.push('/');
        }
    }, [router, user, isHydrated]);

    const displayName = user?.name || user?.email || '';
    const displayEmail = user?.email || '';

    return (
        <div className="flex min-h-screen bg-black text-foreground font-sans selection:bg-primary selection:text-black">
            {/* Mobile Header */}
            <header className="md:hidden h-[64px] px-6 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/10 fixed top-0 left-0 right-0 z-50">
                <Link href="/dashboard" className="font-mono text-xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                    <span className="text-primary">{'///'}</span> INTELLEX
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Mobile Sidebar - Slides from Right */}
            <aside className={clsx(
                "md:hidden fixed inset-y-0 right-0 z-40 flex flex-col bg-black/95 backdrop-blur-xl border-l border-white/10 transition-all duration-300 ease-out",
                "w-[280px]",
                isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Mobile Sidebar Header */}
                <div className="h-[64px] flex items-center justify-between px-6 border-b border-white/10">
                    <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">Menu</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center gap-4 px-5 py-4 transition-all duration-200 border-l-2",
                                    isActive
                                        ? "border-primary bg-gradient-to-r from-primary/20 to-transparent text-primary"
                                        : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon
                                    size={22}
                                    className={clsx(
                                        "shrink-0",
                                        isActive && "text-primary drop-shadow-[0_0_12px_rgba(255,77,0,1)]"
                                    )}
                                />
                                <span className={clsx(
                                    "font-mono text-sm uppercase tracking-wider",
                                    isActive && "font-bold text-primary"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile User Section */}
                <div className="p-4 border-t border-white/10">
                    <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                            {user?.avatarUrl ? (
                                <Image src={user.avatarUrl} alt="avatar" fill className="object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-mono font-bold text-sm text-white truncate uppercase">{displayName}</span>
                            <span className="font-mono text-xs text-muted-foreground truncate">{displayEmail}</span>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3 mt-3 text-sm font-mono uppercase tracking-wider border border-white/10 text-muted-foreground hover:bg-error/10 hover:border-error/50 hover:text-error transition-all duration-200 disabled:opacity-50"
                        disabled={isSigningOut}
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Desktop Sidebar - Slides from Left */}
            <aside className={clsx(
                "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-black border-r border-white/10 transition-all duration-300 ease-out",
                isSidebarOpen ? "w-[280px]" : "w-[80px]"
            )}>
                <div className="h-[80px] flex items-center justify-between px-6 border-b border-white/10">
                    <Link href="/dashboard" className={clsx(
                        "font-mono text-xl font-black text-white tracking-tighter uppercase flex items-center gap-2 transition-all duration-300",
                        !isSidebarOpen && "md:opacity-0 md:w-0 md:hidden"
                    )}>
                        <span className="text-primary">{'///'}</span> INTELLEX
                    </Link>

                    {/* Desktop Collapse Toggle */}
                    <button
                        className={clsx(
                            "hidden md:flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-primary transition-colors",
                            !isSidebarOpen && "mx-auto"
                        )}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "group relative flex items-center gap-4 px-4 py-3 transition-all duration-200 border-l-2",
                                    "hover:bg-white/5",
                                    // Active State
                                    isActive
                                        ? "border-primary bg-gradient-to-r from-primary/25 to-transparent text-primary"
                                        : "border-transparent text-muted-foreground hover:text-white",
                                    // Collapsed state adjustment
                                    !isSidebarOpen && "md:justify-center md:px-2 md:border-l-0"
                                )}
                                title={!isSidebarOpen ? item.label : undefined}
                            >
                                <item.icon
                                    size={20}
                                    className={clsx(
                                        "shrink-0 transition-colors duration-200",
                                        isActive
                                            ? "text-primary drop-shadow-[0_0_12px_rgba(255,77,0,1)]"
                                            : "group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                    )}
                                />

                                <span className={clsx(
                                    "font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                                    isActive && "font-bold text-primary drop-shadow-[0_0_10px_rgba(255,77,0,0.9)]",
                                    !isSidebarOpen && "md:opacity-0 md:w-0 md:hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10 bg-black">
                    <Link href="/profile" className={clsx(
                        "flex items-center gap-3 mb-4 transition-all duration-300 hover:bg-white/5 p-2 border border-transparent hover:border-white/10",
                        !isSidebarOpen ? "md:justify-center" : "px-2"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                            {user?.avatarUrl ? (
                                <Image src={user.avatarUrl} alt="avatar" fill className="object-cover" />
                            ) : (
                                <User size={18} />
                            )}
                        </div>

                        <div className={clsx(
                            "flex flex-col overflow-hidden transition-all duration-300",
                            !isSidebarOpen && "md:hidden"
                        )}>
                            <span className="font-mono font-bold text-xs text-white truncate uppercase">{displayName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate">{displayEmail}</span>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className={clsx(
                            "group flex items-center gap-3 w-full px-4 py-2 text-xs font-mono uppercase tracking-wider",
                            "border border-white/10 text-muted-foreground bg-transparent",
                            "hover:bg-error/10 hover:border-error/50 hover:text-error",
                            "transition-all duration-200 disabled:opacity-50",
                            !isSidebarOpen && "md:justify-center md:px-0"
                        )}
                        disabled={isSigningOut}
                        title="Sign Out"
                    >
                        <LogOut size={16} className="shrink-0 transition-colors" />
                        <span className={clsx(
                            "whitespace-nowrap transition-all duration-300",
                            !isSidebarOpen && "md:hidden"
                        )}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={clsx(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                // Adjust margin based on sidebar state
                isSidebarOpen ? "md:ml-[280px]" : "md:ml-[80px]"
            )}>
                {/* Desktop Top Bar */}
                <div className="hidden md:flex h-[80px] items-end justify-end px-8 pb-2 pointer-events-none relative overflow-visible">
                    {isHydrated && (
                        <DigitalClock
                            scale="xs"
                            timeZone={timezone}
                            className="absolute right-20 bottom-[-100px] origin-top-right scale-[0.45] z-40 filter drop-shadow-[0_0_14px_rgba(255,77,0,0.9)] brightness-110"
                        />
                    )}
                </div>

                <div className="flex-1 p-6 md:p-10 pt-[80px] md:pt-6 overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30 animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
