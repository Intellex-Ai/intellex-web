'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { User, Mail, CreditCard, BarChart3, Edit2, Save, CheckCircle2 } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MfaSetup } from '@/components/auth/MfaSetup';

export default function ProfilePage() {
    const { user, refreshUser } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [profileStatus, setProfileStatus] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [pendingInfo, setPendingInfo] = useState<{ emailConfirmed?: boolean; lastSignIn?: string | null } | null>(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || '',
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Keep local form data in sync when the persisted user hydrates or updates.
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                avatarUrl: user.avatarUrl || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        setProfileError(null);
        setProfileStatus(null);
        try {
            if (!formData.name.trim()) {
                throw new Error('Name is required');
            }

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    name: formData.name.trim(),
                    avatarUrl: formData.avatarUrl || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to update profile');
            }

            setProfileStatus('Profile updated. If you changed email, check your inbox to confirm.');
            setIsEditing(false);
            await refreshUser();
            setIsEditing(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update profile';
            setProfileError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPending = async () => {
        if (!formData.email) return;
        try {
            const res = await fetch(`/api/profile/pending?email=${encodeURIComponent(formData.email)}`);
            if (!res.ok) return;
            const data = await res.json();
            setPendingInfo({
                emailConfirmed: !!data.user?.email_confirmed,
                lastSignIn: data.user?.last_sign_in_at ?? null,
            });
        } catch {
            // non-blocking
        }
    };

    useEffect(() => {
        loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.email]);

    const handleAvatarUpload = async (file: File) => {
        setAvatarUploading(true);
        setProfileError(null);
        setProfileStatus(null);
        try {
            const form = new FormData();
            form.append('email', formData.email);
            form.append('file', file);
            const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to upload avatar');
            }
            const data = await res.json();
            setFormData((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
            setProfileStatus('Avatar updated');
            await refreshUser();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload avatar';
            setProfileError(message);
        } finally {
            setAvatarUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-4 md:p-8 max-w-[1100px] mx-auto lg:mx-0">
                {/* Header */}
                <header className="mb-8 md:mb-12">
                    <h1 className="text-2xl md:text-4xl font-mono font-bold mb-2 tracking-tighter text-white uppercase">
                        <TextScramble text="USER_PROFILE" />
                    </h1>
                    <p className="text-muted font-mono text-xs md:text-sm tracking-wide">
                        {`// IDENTITY_AND_SUBSCRIPTION`}
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
                    {/* Left Column: Identity */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '0ms' }}>
                            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                <User size={20} className="text-primary" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Identity</h2>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-lg relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-xs font-mono text-primary flex items-center gap-2 hover:underline uppercase tracking-wider"
                                        >
                                            <Edit2 size={12} /> Edit_Profile
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center text-primary relative overflow-hidden shadow-[0_0_30px_-10px_rgba(255,77,0,0.3)]">
                                            {formData.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={48} />
                                            )}
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/60 text-xs text-white font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    Change
                                                </button>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleAvatarUpload(f);
                                                }}
                                            />
                                        </div>
                                        {avatarUploading && <p className="text-xs text-muted font-mono mt-2">Uploading...</p>}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-2">
                                                <User size={12} /> Display Name
                                            </label>
                                            {isEditing ? (
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="font-mono"
                                                />
                                            ) : (
                                                <p className="text-xl text-white font-mono font-bold">{formData.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-2">
                                                <Mail size={12} /> Email Address
                                            </label>
                                            <div className="space-y-2">
                                                <Input
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="font-mono"
                                                />
                                                {pendingInfo && (
                                                    <div className="text-xs text-muted font-mono flex flex-wrap items-center gap-2">
                                                        <span>Email {pendingInfo.emailConfirmed ? 'confirmed' : 'pending confirmation'}</span>
                                                        {pendingInfo.lastSignIn && <span>• Last sign-in: {pendingInfo.lastSignIn}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="flex flex-wrap gap-3 pt-2 items-center">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSave}
                                                    isLoading={isLoading}
                                                    leftIcon={<Save size={14} />}
                                                >
                                                    SAVE_CHANGES
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsEditing(false)}
                                                >
                                                    CANCEL
                                                </Button>
                                                {profileStatus && <span className="text-xs text-primary font-mono">{profileStatus}</span>}
                                                {profileError && <span className="text-xs text-error font-mono">{profileError}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/10">
                                <BarChart3 size={20} className="text-primary" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Usage_Stats</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/50 border border-white/10 p-4 rounded-sm">
                                    <p className="text-xs text-muted font-mono uppercase mb-2">Research Queries</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white font-mono">15</span>
                                        <span className="text-sm text-muted font-mono mb-1">/ 50</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[30%]" />
                                    </div>
                                </div>
                                <div className="bg-black/50 border border-white/10 p-4 rounded-sm">
                                    <p className="text-xs text-muted font-mono uppercase mb-2">Storage Used</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white font-mono">1.2</span>
                                        <span className="text-sm text-muted font-mono mb-1">GB</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[12%]" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Subscription */}
                    <div className="md:col-span-1">
                        <section className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/10">
                                <CreditCard size={20} className="text-primary" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Plan</h2>
                            </div>

                            <div className="bg-gradient-to-b from-primary/10 to-black border border-primary/30 p-6 rounded-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-2xl rounded-full -mr-10 -mt-10" />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white font-mono mb-1">PRO PLAN</h3>
                                    <p className="text-xs text-primary font-mono uppercase tracking-wider mb-6">Active Subscription</p>

                                    <ul className="space-y-3 mb-8">
                                        {[
                                            'Unlimited Projects',
                                            'GPT-4 Access',
                                            'Priority Support',
                                            'API Access'
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-white/80 font-mono">
                                                <CheckCircle2 size={14} className="text-primary" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button className="w-full" variant="secondary">
                                        MANAGE_SUBSCRIPTION
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '250ms' }}>
                            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                <User size={20} className="text-primary" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Security</h2>
                            </div>
                            <MfaSetup onComplete={refreshUser} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
