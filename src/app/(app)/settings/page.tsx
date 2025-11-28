'use client';

import React, { useState } from 'react';
import { useStore } from '@/store';
import { Bell, Shield, LogOut, Moon, Monitor, Key, Globe, Clock, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextScramble } from '@/components/ui/TextScramble';

export default function SettingsPage() {
    const { logout } = useStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '' });

    const handleSignOut = async () => {
        await logout();
        router.push('/');
    };

    const handleSave = () => {
        setIsLoading(true);
        // Simulate save
        setTimeout(() => {
            setIsLoading(false);
            // In a real app, we'd show a toast here
        }, 1000);
    };

    const sections = [
        {
            title: 'General',
            icon: Globe,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted uppercase tracking-wider">Language</label>
                            <div className="flex items-center justify-between p-3 bg-black/50 border border-white/10 rounded-sm">
                                <span className="text-sm text-white font-mono">English (US)</span>
                                <Globe size={14} className="text-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted uppercase tracking-wider">Timezone</label>
                            <div className="flex items-center justify-between p-3 bg-black/50 border border-white/10 rounded-sm">
                                <span className="text-sm text-white font-mono">UTC-08:00 (Pacific Time)</span>
                                <Clock size={14} className="text-muted" />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'API_Keys',
            icon: Key,
            content: (
                <div className="space-y-6">
                    <p className="text-xs text-muted font-mono mb-4">
                        Provide your API keys to enable LLM capabilities. Keys are stored locally on your device.
                    </p>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-primary uppercase tracking-wider">OpenAI API Key</label>
                            <Input
                                placeholder="sk-..."
                                type="password"
                                value={apiKeys.openai}
                                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-primary uppercase tracking-wider">Anthropic API Key</label>
                            <Input
                                placeholder="sk-ant-..."
                                type="password"
                                value={apiKeys.anthropic}
                                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="pt-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                isLoading={isLoading}
                                leftIcon={<Save size={14} />}
                            >
                                SAVE_KEYS
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Preferences',
            icon: Monitor,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/50 border border-white/10 rounded-none">
                        <div className="flex items-center gap-3">
                            <Moon size={18} className="text-muted" />
                            <div>
                                <h4 className="text-sm font-bold text-white font-mono uppercase">Theme</h4>
                                <p className="text-xs text-muted font-mono">System Default</p>
                            </div>
                        </div>
                        <div className="flex bg-black border border-white/10 p-1 rounded-none">
                            <button className="px-3 py-1 text-[10px] font-mono uppercase bg-white/10 text-white rounded-none">Dark</button>
                            <button className="px-3 py-1 text-[10px] font-mono uppercase text-muted hover:text-white">Light</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/50 border border-white/10 rounded-none">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-muted" />
                            <div>
                                <h4 className="text-sm font-bold text-white font-mono uppercase">Notifications</h4>
                                <p className="text-xs text-muted font-mono">Email digests enabled</p>
                            </div>
                        </div>
                        <div className="w-10 h-5 bg-primary/20 rounded-full relative cursor-pointer border border-primary/50">
                            <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 bg-primary rounded-full shadow-[0_0_10px_rgba(255,77,0,0.8)]" />
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Security',
            icon: Shield,
            content: (
                <div className="space-y-4">
                    <div className="p-4 border border-error/20 bg-error/5 rounded-none">
                        <h4 className="text-sm font-bold text-error mb-2 font-mono uppercase">Danger Zone</h4>
                        <p className="text-xs text-muted font-mono mb-4">
                            Sign out of your account on all devices.
                        </p>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleSignOut}
                            leftIcon={<LogOut size={14} />}
                        >
                            SIGN_OUT
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 max-w-4xl relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-2 md:p-8">
                {/* Header */}
                <header className="mb-8 md:mb-12">
                    <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                        <TextScramble text="SYSTEM_CONFIG" />
                    </h1>
                    <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                        {`// USER_PREFERENCES_AND_SECURITY`}
                    </p>
                </header>

                <div className="space-y-8 md:space-y-12 pb-20">
                    {sections.map((section, index) => (
                        <section
                            key={index}
                            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-4 md:mb-6 pb-2 border-b border-white/10">
                                <section.icon size={20} className="text-primary" />
                                <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wide font-mono">{section.title}</h2>
                            </div>
                            <div className="pl-0 md:pl-8">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
