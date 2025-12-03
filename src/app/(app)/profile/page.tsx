'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { User, Mail, CreditCard, BarChart3, Edit2, Save, CheckCircle2, Briefcase, Building2, MapPin, FileText, Shield, Trash2 } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MfaSetup } from '@/components/auth/MfaSetup';
import { AuthService } from '@/services/api/auth';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
    const router = useRouter();
    const { user, refreshUser, logout } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [profileStatus, setProfileStatus] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [pendingInfo, setPendingInfo] = useState<{ emailConfirmed?: boolean; lastSignIn?: string | null } | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || '',
        title: user?.preferences?.title || '',
        organization: user?.preferences?.organization || '',
        location: user?.preferences?.location || '',
        bio: user?.preferences?.bio || '',
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
                title: user.preferences?.title || '',
                organization: user.preferences?.organization || '',
                location: user.preferences?.location || '',
                bio: user.preferences?.bio || '',
            });
        }
    }, [user]);

    // If the profile name is empty, hydrate it from Supabase auth metadata (useful right after OAuth signup).
    useEffect(() => {
        if (formData.name.trim()) return;
        const loadAuthName = async () => {
            const { data } = await supabase.auth.getUser();
            const authUser = data?.user;
            if (!authUser) return;
            const meta = (authUser.user_metadata as Record<string, unknown>) || {};
            const displayName =
                (meta.display_name as string) ||
                (meta.full_name as string) ||
                (meta.name as string) ||
                (authUser.email ?? '');
            if (!displayName) return;
            setFormData((prev) => ({
                ...prev,
                name: prev.name || displayName,
            }));
        };
        void loadAuthName();
    }, [formData.name]);

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
                    title: formData.title,
                    organization: formData.organization,
                    location: formData.location,
                    bio: formData.bio,
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

    const handleDeleteAccount = async () => {
        if (!user) {
            setDeleteError('No user session found.');
            return;
        }
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { data } = await supabase.auth.getUser();
            const supabaseUserId = data?.user?.id;
            if (!supabaseUserId) {
                throw new Error('Missing Supabase auth session. Please re-login and try again.');
            }

            const result = await AuthService.deleteAccount({
                userId: user.id,
                email: user.email,
                supabaseUserId,
            });

            if (!result.deleted) {
                throw new Error('Account deletion failed. Please try again.');
            }

            await logout();
            // Clear any persisted store snapshot to avoid showing stale data on next load.
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('zustand-persist:intellex-store');
            }
            router.replace('/');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete account';
            setDeleteError(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 p-4 md:p-8 w-full">
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
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <User size={20} className="text-primary" />
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Identity_Card</h2>
                                </div>
                                {!isEditing && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsEditing(true)}
                                        leftIcon={<Edit2 size={14} />}
                                        className="text-xs font-mono uppercase tracking-wider hover:bg-white/5 h-7"
                                    >
                                        Edit_Profile
                                    </Button>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="relative bg-white/5 border border-white/10 p-5 md:p-6 rounded-lg overflow-hidden">
                                    {/* Original top highlight */}
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                    {/* Background decoration - kept subtle */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none opacity-50" />

                                    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-center relative z-10">
                                        {/* Avatar Column */}
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative group/avatar">
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-primary relative overflow-hidden shadow-[0_0_40px_-10px_rgba(255,77,0,0.4)] transition-all duration-300 group-hover/avatar:border-primary/50 group-hover/avatar:shadow-[0_0_60px_-10px_rgba(255,77,0,0.6)]">
                                                    {formData.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={48} className="opacity-50" />
                                                    )}

                                                    {/* Upload Overlay */}
                                                    {(isEditing || !formData.avatarUrl) && (
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 ${isEditing ? 'opacity-0 group-hover/avatar:opacity-100' : 'opacity-0'}`}
                                                        >
                                                            <div className="p-2 bg-white/10 rounded-full mb-1 backdrop-blur-sm">
                                                                <Edit2 size={16} className="text-white" />
                                                            </div>
                                                            <span className="text-[9px] font-mono uppercase text-white tracking-wider">Change</span>
                                                        </div>
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
                                                {avatarUploading && (
                                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full text-center">
                                                        <span className="text-[9px] text-primary font-mono animate-pulse">UPLOADING...</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* User Status Badge */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                                    <span className="text-[9px] font-mono text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${pendingInfo?.emailConfirmed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-yellow-500'}`} />
                                                        {pendingInfo?.emailConfirmed ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Column */}
                                        <div className="flex-1 min-w-0 space-y-4">
                                            {/* Header / Name Section */}
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 pb-4 border-b border-white/5">
                                                <div className="space-y-0.5">
                                                    {isEditing ? (
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-mono text-primary uppercase tracking-wider">Display Name</label>
                                                            <Input
                                                                value={formData.name}
                                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                                className="font-mono text-lg font-bold bg-white/5 border-white/10 focus:border-primary/50 h-10"
                                                                placeholder="ENTER_NAME"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h3 className="text-xl md:text-2xl text-white font-mono font-bold tracking-tight">
                                                                {formData.name || 'Anonymous User'}
                                                            </h3>
                                                            <p className="text-xs font-mono text-muted flex items-center gap-2">
                                                                @{formData.email.split('@')[0]}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                {isEditing && (
                                                    <div className="flex items-center gap-2 self-start">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setIsEditing(false)}
                                                            className="text-[10px] h-8 hover:bg-white/5 text-muted hover:text-white"
                                                        >
                                                            CANCEL
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSave}
                                                            isLoading={isLoading}
                                                            leftIcon={<Save size={12} />}
                                                            className="bg-primary hover:bg-primary/90 text-black font-bold h-8 text-[10px]"
                                                        >
                                                            SAVE
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status Messages */}
                                            {(profileStatus || profileError) && (
                                                <div className={`p-2 rounded-sm border ${profileStatus ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-error/10 border-error/20 text-error'} font-mono text-[10px] flex items-center gap-2`}>
                                                    {profileStatus ? <CheckCircle2 size={12} /> : <Shield size={12} />}
                                                    {profileStatus || profileError}
                                                </div>
                                            )}

                                            {/* Form Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                                                        <Mail size={10} /> Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            className="font-mono bg-black/20 border-white/10 text-white/90 h-9 text-xs"
                                                            disabled={!isEditing}
                                                        />
                                                        {!isEditing && <div className="absolute inset-0 bg-transparent cursor-default" />}
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                                                        <Briefcase size={10} /> Title / Role
                                                    </label>
                                                    {isEditing ? (
                                                        <Input
                                                            value={formData.title}
                                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                            className="font-mono bg-black/20 border-white/10 h-9 text-xs"
                                                            placeholder="e.g. Senior Researcher"
                                                        />
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-sm min-h-[36px] flex items-center">
                                                            <span className="text-xs text-white font-mono">{formData.title || '—'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                                                        <Building2 size={10} /> Organization
                                                    </label>
                                                    {isEditing ? (
                                                        <Input
                                                            value={formData.organization}
                                                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                                            className="font-mono bg-black/20 border-white/10 h-9 text-xs"
                                                            placeholder="e.g. Intellex Labs"
                                                        />
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-sm min-h-[36px] flex items-center">
                                                            <span className="text-xs text-white font-mono">{formData.organization || '—'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                                                        <MapPin size={10} /> Location
                                                    </label>
                                                    {isEditing ? (
                                                        <Input
                                                            value={formData.location}
                                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                            className="font-mono bg-black/20 border-white/10 h-9 text-xs"
                                                            placeholder="e.g. San Francisco, CA"
                                                        />
                                                    ) : (
                                                        <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-sm min-h-[36px] flex items-center">
                                                            <span className="text-xs text-white font-mono">{formData.location || '—'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-[9px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                                                        <FileText size={10} /> Bio
                                                    </label>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={formData.bio}
                                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                            className="w-full bg-black/20 border border-white/10 text-white font-mono text-xs p-2.5 outline-none focus:border-primary/50 rounded-sm min-h-[60px] resize-none"
                                                            placeholder="Briefly describe your research focus..."
                                                        />
                                                    ) : (
                                                        <div className="p-3 bg-white/5 border border-white/5 rounded-sm min-h-[60px]">
                                                            <p className="text-xs text-white/80 font-mono whitespace-pre-wrap leading-relaxed">
                                                                {formData.bio || 'No bio added yet.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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

                    {/* Right Column: Subscription + Security */}
                    <div className="md:col-span-1">
                        <div className="grid grid-cols-1 gap-6 lg:gap-8">
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

                            <section className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '250ms' }}>
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                    <User size={20} className="text-primary" />
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wide font-mono">Security</h2>
                                </div>
                                <MfaSetup onComplete={refreshUser} />
                            </section>

                            <section className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: '300ms' }}>
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-error/40">
                                    <Trash2 size={20} className="text-error" />
                                    <h2 className="text-lg font-bold text-error uppercase tracking-wide font-mono">Danger_Zone</h2>
                                </div>
                                <div className="bg-gradient-to-r from-error/10 via-black to-black border border-error/30 p-4 rounded-sm space-y-3">
                                    <p className="text-xs text-muted font-mono leading-relaxed">
                                        Permanently delete your profile, projects, plans, and messages. This action cannot be undone.
                                    </p>
                                    <div className="space-y-2">
                                        <Input
                                            value={deleteConfirm}
                                            onChange={(e) => setDeleteConfirm(e.target.value)}
                                            placeholder="Type DELETE to confirm"
                                            className="font-mono bg-black/40 border-error/40 text-error placeholder:text-error/60"
                                        />
                                        {deleteError && (
                                            <div className="p-2 rounded-sm border border-error/40 bg-error/10 text-error text-[11px] font-mono">
                                                {deleteError}
                                            </div>
                                        )}
                                        <Button
                                            variant="danger"
                                            className="w-full"
                                            disabled={deleteConfirm.trim().toUpperCase() !== 'DELETE' || isDeleting}
                                            isLoading={isDeleting}
                                            leftIcon={<Trash2 size={14} />}
                                            onClick={handleDeleteAccount}
                                        >
                                            Delete Account
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
