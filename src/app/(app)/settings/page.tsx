'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Shield, LogOut, Moon, Monitor, Key, Globe, Clock, Save, MonitorSmartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextScramble } from '@/components/ui/TextScramble';
import { UserService } from '@/services/api/user';
import { DeviceService } from '@/services/api/device';
import { ApiKeySummary, DeviceRecord } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { getDeviceId } from '@/lib/device';

const timezones = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'London (GMT)', value: 'Europe/London' },
    { label: 'India (IST)', value: 'Asia/Kolkata' },
    { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
];

export default function SettingsPage() {
    const { logout, user, timezone, setTimezone } = useStore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '' });
    const [storedKeys, setStoredKeys] = useState<ApiKeySummary[]>([]);
    const [deviceInfo, setDeviceInfo] = useState<DeviceRecord[]>([]);
    const [deviceError, setDeviceError] = useState<string | null>(null);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [revokingDevices, setRevokingDevices] = useState(false);
    const currentDeviceId = useMemo(() => getDeviceId(), []);

    const handleSignOut = async () => {
        await logout();
        router.push('/');
    };

    const handleSignOutEverywhere = async () => {
        setRevokingDevices(true);
        try {
            await DeviceService.revoke({ scope: 'all' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to sign out on all devices';
            setDeviceError(message);
            toast({
                variant: 'error',
                title: 'Sign-out failed',
                message,
            });
        } finally {
            setRevokingDevices(false);
        }
        await handleSignOut();
    };

    const handleSave = async () => {
        if (!apiKeys.openai && !apiKeys.anthropic) {
            return;
        }
        setIsLoading(true);
        try {
            const res = await UserService.saveApiKeys({
                ...(apiKeys.openai ? { openai: apiKeys.openai } : {}),
                ...(apiKeys.anthropic ? { anthropic: apiKeys.anthropic } : {}),
            });
            setStoredKeys(res.keys);
            setApiKeys({ openai: '', anthropic: '' });
            toast({
                variant: 'success',
                title: 'Keys Stored',
                message: 'API keys encrypted and saved securely.',
            });
        } catch (err) {
            console.error('Failed to save API keys', err);
            toast({
                variant: 'error',
                title: 'Save Failed',
                message: err instanceof Error ? err.message : 'Unable to store API keys.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await UserService.getApiKeys();
                setStoredKeys(res.keys);
            } catch (err) {
                console.warn('No stored API keys', err);
            }
        };
        void load();
    }, []);

    const formatTimestamp = (value?: number | null) => {
        if (!value) return '—';
        try {
            return new Date(value).toLocaleString();
        } catch {
            return '—';
        }
    };

    const refreshDevices = useCallback(async () => {
        if (!user?.id) return;
        setDevicesLoading(true);
        try {
            const res = await DeviceService.list();
            setDeviceInfo(res.devices || []);
            setDeviceError(null);
        } catch (err) {
            setDeviceError(err instanceof Error ? err.message : 'Failed to load devices');
        } finally {
            setDevicesLoading(false);
        }
    }, [user?.id]);

    const handleSignOutOthers = async () => {
        if (!currentDeviceId) {
            setDeviceError('Unable to determine current device. Please reload and try again.');
            return;
        }
        setRevokingDevices(true);
        try {
            await DeviceService.revoke({ scope: 'others', deviceId: currentDeviceId });
            await refreshDevices();
            toast({
                variant: 'success',
                title: 'Signed out elsewhere',
                message: 'All other devices have been revoked.',
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to sign out other devices';
            setDeviceError(message);
            toast({
                variant: 'error',
                title: 'Sign-out failed',
                message,
            });
        } finally {
            setRevokingDevices(false);
        }
    };

    useEffect(() => {
        void refreshDevices();
    }, [refreshDevices]);

    const sections = [
        {
            title: 'General',
            icon: Globe,
            span: 1,
            lgSpan: 1,
            className: 'md:max-w-xl p-4 md:p-5',
            content: (
                <div className="space-y-5 max-w-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted uppercase tracking-wider">Language</label>
                            <div className="flex items-center justify-between p-3 bg-black/50 border border-white/10 rounded-sm">
                                <span className="text-sm text-white font-mono">English (US)</span>
                                <Globe size={14} className="text-muted" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted uppercase tracking-wider">Timezone</label>
                            <div className="flex items-center gap-3 p-3 bg-black/50 border border-white/10 rounded-sm min-w-0">
                                <Clock size={14} className="text-muted" />
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="flex-1 min-w-0 bg-transparent text-sm text-white font-mono border border-white/10 px-2 py-1 outline-none focus:border-primary"
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz.value} value={tz.value} className="bg-black text-white">
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'API_Keys',
            icon: Key,
            span: 1,
            lgSpan: 1,
            content: (
                <div className="space-y-6">
                    <p className="text-xs text-muted font-mono mb-4">
                        Provide your API keys to enable LLM capabilities. Keys are encrypted and stored server-side.
                    </p>
                    {storedKeys.length > 0 && (
                        <div className="space-y-2 text-xs text-muted font-mono">
                            {storedKeys.map((k) => (
                                <div key={k.provider} className="flex items-center justify-between border border-white/10 p-2 bg-black/50">
                                    <span className="uppercase tracking-wider">{k.provider}</span>
                                    <span className="text-white">••••{k.last4}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
            span: 1,
            lgSpan: 1,
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
                </div>
            )
        },
        {
            title: 'Security',
            icon: Shield,
            span: 2,
            lgSpan: 3,
            content: (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-bold text-white font-mono uppercase">Devices</h4>
                                <p className="text-xs text-muted font-mono">Track active sessions and sign out remotely.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={refreshDevices}
                                    isLoading={devicesLoading}
                                >
                                    REFRESH
                                </Button>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={handleSignOutOthers}
                                    disabled={!currentDeviceId}
                                    isLoading={revokingDevices}
                                    leftIcon={<LogOut size={14} />}
                                >
                                    SIGN_OUT_OTHERS
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {deviceInfo.map((device) => {
                                const isCurrent = Boolean(currentDeviceId && device.deviceId === currentDeviceId);
                                const revoked = Boolean(device.revokedAt);
                                const location = [device.city, device.region].filter(Boolean).join(', ') || device.ip;
                                return (
                                    <div
                                        key={device.deviceId}
                                        className={`p-4 border ${revoked ? 'border-error/50' : 'border-white/10'} bg-black/50 rounded-sm flex gap-3`}
                                    >
                                        <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-sm">
                                            <MonitorSmartphone size={18} />
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <p className="text-sm text-white font-mono truncate">{device.platform || 'Unknown device'}</p>
                                            <p className="text-xs text-muted font-mono truncate">{device.userAgent || 'No user agent'}</p>
                                            <p className="text-xs text-muted font-mono">Last seen: {formatTimestamp(device.lastSeenAt)}</p>
                                            <p className="text-xs text-muted font-mono">Last sign-in: {formatTimestamp(device.lastLoginAt)}</p>
                                            {location && (
                                                <p className="text-xs text-muted font-mono truncate">{location}</p>
                                            )}
                                            {device.label && (
                                                <p className="text-[10px] text-muted font-mono uppercase truncate">Label: {device.label}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {isCurrent && (
                                                    <span className="text-[10px] font-mono uppercase text-primary bg-primary/10 px-2 py-1 inline-block">
                                                        Current Session
                                                    </span>
                                                )}
                                                {revoked && (
                                                    <span className="text-[10px] font-mono uppercase text-error bg-error/10 px-2 py-1 inline-block">
                                                        Revoked
                                                    </span>
                                                )}
                                                {!revoked && device.isTrusted && (
                                                    <span className="text-[10px] font-mono uppercase text-muted bg-white/5 px-2 py-1 inline-block">
                                                        Trusted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {deviceInfo.length === 0 && !devicesLoading && (
                                <div className="text-xs text-muted font-mono">No device info available. Sign in to register this device.</div>
                            )}
                            {devicesLoading && <div className="text-xs text-muted font-mono">Syncing devices...</div>}
                            {deviceError && <div className="text-xs text-error font-mono">{deviceError}</div>}
                        </div>
                    </div>

                    <div className="p-4 border border-error/20 bg-error/5 rounded-none">
                        <h4 className="text-sm font-bold text-error mb-2 font-mono uppercase">Danger Zone</h4>
                        <p className="text-xs text-muted font-mono mb-4">
                            Sign out of your account on all devices.
                        </p>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleSignOutEverywhere}
                            isLoading={revokingDevices}
                            leftIcon={<LogOut size={14} />}
                        >
                            SIGN_OUT_ALL
                        </Button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-2 md:p-8 w-full max-w-none">
                {/* Header */}
                <header className="mb-8 md:mb-12">
                    <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                        <TextScramble text="SYSTEM_CONFIG" />
                    </h1>
                    <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                        {`// USER_PREFERENCES_AND_SECURITY`}
                    </p>
                </header>

                <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pb-20">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className={`border border-white/10 bg-black/40 p-5 md:p-6 rounded-sm ${section.span === 2 ? 'md:col-span-2' : ''} ${section.span === 3 ? 'md:col-span-3' : ''} ${section.lgSpan === 2 ? 'lg:col-span-2' : ''} ${section.lgSpan === 3 ? 'lg:col-span-3' : ''} ${section.className ?? ''}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <section.icon size={16} className="text-primary" />
                                <h2 className="text-sm md:text-base font-bold text-white font-mono uppercase tracking-wider">
                                    {section.title}
                                </h2>
                            </div>
                            {section.content}
                        </section>
                    ))}
                </div>
            </div>
        </div >
    );
}
