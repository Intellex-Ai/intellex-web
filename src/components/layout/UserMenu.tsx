import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User as UserIcon } from 'lucide-react';
import type { User } from '@/types';

type MenuItem = { label: string; href: string };

const defaultItems: MenuItem[] = [
    { label: 'Profile', href: '/profile' },
    { label: 'Projects', href: '/projects' },
    { label: 'Settings', href: '/settings' },
];

interface UserMenuProps {
    user: User;
    onLogout: () => Promise<void> | void;
    items?: MenuItem[];
}

export function UserMenu({ user, onLogout, items = defaultItems }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleNav = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    const handleLogout = async () => {
        setOpen(false);
        try {
            await onLogout();
        } catch (err) {
            console.warn('Logout failed', err);
        }
    };

    return (
        <div className="relative">
            <button
                className="flex items-center gap-3 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 transition rounded-full"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                    {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="avatar" width={32} height={32} className="object-cover" />
                    ) : (
                        <UserIcon size={16} />
                    )}
                </div>
                <span className="font-mono text-sm uppercase tracking-wide hidden xl:inline">
                    {user.name || user.email}
                </span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-black border border-white/10 shadow-lg py-2 z-50">
                    {items.map((item) => (
                        <button
                            key={item.href}
                            onClick={() => handleNav(item.href)}
                            className="w-full text-left px-4 py-2 text-sm font-mono text-white hover:bg-white/10"
                        >
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm font-mono text-error hover:bg-error/10"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
