'use client';

import { useStore } from '@/store';

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
    const { logout } = useStore();

    const handleSignOut = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="flex min-h-screen bg-black text-foreground font-sans selection:bg-primary selection:text-black">
            {/* Mobile Header */}
            <header className="md:hidden h-[64px] px-6 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/10 fixed top-0 left-0 right-0 z-50">
                <Link href="/dashboard" className="font-mono text-xl font-bold text-white tracking-tight uppercase">
                    Intellex
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 flex flex-col bg-black/90 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                // Base (Mobile)
                "w-[280px] -translate-x-full",
                isMobileMenuOpen && "translate-x-0",

                // Desktop
                "md:translate-x-0",
                isSidebarOpen ? "md:w-[280px]" : "md:w-[80px]"
            )}>
                {/* Sidebar Header */}
                <div className="h-[80px] flex items-center justify-between px-6 border-b border-white/10 overflow-hidden">
                    <Link href="/dashboard" className={clsx(
                        "font-mono text-2xl font-bold text-white tracking-tighter uppercase whitespace-nowrap transition-all duration-300",
                        !isSidebarOpen && "md:opacity-0 md:w-0 md:hidden"
                    )}>
                        Intellex
                    </Link>

                    {/* Desktop Collapse Toggle */}
                    <button
                        className={clsx(
                            "hidden md:flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-primary transition-colors",
                            !isSidebarOpen && "mx-auto"
                        )}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center gap-4 px-4 py-3 rounded-none transition-all duration-200 relative overflow-hidden",
                                    // Active State
                                    isActive
                                        ? "text-primary bg-primary/5"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5",
                                    // Collapsed state adjustment
                                    !isSidebarOpen && "md:justify-center md:px-2"
                                )}
                                title={!isSidebarOpen ? item.label : undefined}
                            >
                                {/* Active Indicator Line */}
                                {isActive && (
                                    <div className={clsx(
                                        "absolute left-0 top-0 bottom-0 w-[2px] bg-primary shadow-[0_0_8px_rgba(255,77,0,0.5)]",
                                        !isSidebarOpen && "md:left-0"
                                    )} />
                                )}

                                <item.icon size={20} className={clsx(
                                    "shrink-0 transition-colors duration-200",
                                    isActive ? "text-primary drop-shadow-[0_0_5px_rgba(255,77,0,0.5)]" : "group-hover:text-white"
                                )} />

                                <span className={clsx(
                                    "font-mono text-sm uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                                    !isSidebarOpen && "md:opacity-0 md:w-0 md:hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                    <Link href="/profile" className={clsx(
                        "flex items-center gap-3 mb-4 transition-all duration-300 hover:bg-white/5 p-2 rounded-sm -mx-2",
                        !isSidebarOpen ? "md:justify-center" : "px-2"
                    )}>
                        <div className="w-10 h-10 rounded-full bg-surface-200 border border-white/10 flex items-center justify-center text-primary shrink-0 relative group cursor-pointer overflow-hidden">
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <User size={18} />
                        </div>

                        <div className={clsx(
                            "flex flex-col overflow-hidden transition-all duration-300",
                            !isSidebarOpen && "md:hidden"
                        )}>
                            <span className="font-bold text-sm text-white truncate">Researcher</span>
                            <span className="text-xs text-muted-foreground truncate">user@intellex.ai</span>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut}
                        className={clsx(
                            "flex items-center gap-3 w-full px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-error hover:bg-error/10 transition-all duration-200 rounded-sm group",
                            !isSidebarOpen && "md:justify-center md:px-0"
                        )}
                        title="Sign Out"
                    >
                        <LogOut size={18} className="shrink-0 group-hover:text-error transition-colors" />
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
                {/* Desktop Top Bar (Optional - can be removed if not needed, or used for breadcrumbs/actions) */}
                <div className="hidden md:flex h-[80px] items-center justify-end px-8 sticky top-0 z-30 pointer-events-none">
                    {/* Add global actions here if needed */}
                </div>

                <div className="flex-1 p-6 md:p-10 pt-[80px] md:pt-6 overflow-y-auto">
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
