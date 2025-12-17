'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Edit2, Save, CheckCircle2, Briefcase, Building2, MapPin,
    Shield, Trash2, ChevronDown, CreditCard, BarChart3, HardDrive, Zap, X
} from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MfaSetup } from '@/components/auth/MfaSetup';
import { AuthProviders } from '@/components/auth/AuthProviders';
import { AuthService } from '@/services/api/auth';
import { supabase } from '@/lib/supabase';
import { extractAuthProfile } from '@/lib/auth-metadata';
import { getSiteUrl } from '@/lib/site-url';

type SettingsTab = 'account' | 'security' | 'billing';

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
    const [dangerExpanded, setDangerExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [mountedTabs, setMountedTabs] = useState<Record<SettingsTab, boolean>>({
        account: true,
        security: false,
        billing: false,
    });
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
    const authPrefillAttempted = useRef(false);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

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

    useEffect(() => {
        const needsPrefill = !formData.name.trim() || !formData.email.trim() || !formData.avatarUrl;
        if (!needsPrefill || authPrefillAttempted.current || isEditing) return;

        const hydrateFromAuth = async () => {
            const { data } = await supabase.auth.getUser();
            const authUser = data?.user;
            if (!authUser) return;
            const authProfile = extractAuthProfile(authUser);
            if (!authProfile.name && !authProfile.email && !authProfile.avatarUrl) return;

            setFormData((prev) => ({
                ...prev,
                name: prev.name || authProfile.name || '',
                email: prev.email || authProfile.email || '',
                avatarUrl: prev.avatarUrl || authProfile.avatarUrl || '',
            }));
        };

        authPrefillAttempted.current = true;
        void hydrateFromAuth();
    }, [formData.name, formData.email, formData.avatarUrl, isEditing]);

    const handleSave = async () => {
        if (!user) {
            setProfileError('No active session. Please re-login.');
            return;
        }
        setIsLoading(true);
        setProfileError(null);
        setProfileStatus(null);
        try {
            if (!formData.name.trim()) {
                throw new Error('Name is required');
            }

            const normalizedEmail = formData.email.trim().toLowerCase();
            const originalEmail = (user.email || '').toLowerCase();
            const emailChanged = Boolean(normalizedEmail && normalizedEmail !== originalEmail);

            if (emailChanged) {
                const baseUrl = getSiteUrl();
                const emailRedirectTo = baseUrl ? `${baseUrl}/auth/email-verified?email=${encodeURIComponent(normalizedEmail)}` : undefined;
                const { error: emailChangeError } = await supabase.auth.updateUser(
                    { email: normalizedEmail, data: { display_name: formData.name.trim() } },
                    emailRedirectTo ? { emailRedirectTo } : undefined
                );
                if (emailChangeError) {
                    throw new Error(emailChangeError.message || 'Failed to start email change');
                }
            }

            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) {
                throw new Error('Missing auth session. Please re-login.');
            }

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
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

            setProfileStatus(
                emailChanged
                    ? 'Email change requested. Check your new inbox to confirm.'
                    : 'Profile updated.'
            );
            setIsEditing(false);
            await refreshUser();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update profile';
            setProfileError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPending = useCallback(async (email: string) => {
        if (!email) return;
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) return;
            const res = await fetch('/api/profile/pending', {
                headers: { authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setPendingInfo({
                emailConfirmed: !!data.user?.email_confirmed,
                lastSignIn: data.user?.last_sign_in_at ?? null,
            });
        } catch {
            setPendingInfo(null);
        }
    }, []);

    useEffect(() => {
        void loadPending(formData.email);
    }, [formData.email, loadPending]);

    const handleTabSelect = (tabId: SettingsTab) => {
        setActiveTab(tabId);
        setMountedTabs((prev) => (prev[tabId] ? prev : { ...prev, [tabId]: true }));
    };

    const handleAvatarUpload = async (file: File) => {
        setAvatarUploading(true);
        setProfileError(null);
        setProfileStatus(null);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) {
                throw new Error('Missing auth session. Please re-login.');
            }

            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: { authorization: `Bearer ${accessToken}` },
                body: form,
            });
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

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'account', label: 'Account', icon: <User size={14} /> },
        { id: 'security', label: 'Security', icon: <Shield size={14} /> },
        { id: 'billing', label: 'Billing', icon: <CreditCard size={14} /> },
    ];

    return (
        <div className="min-h-screen bg-black animate-in fade-in duration-700 relative overflow-hidden">
            {/* Static Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 px-2 py-4 sm:px-4 sm:py-6 md:p-8 lg:p-10 w-full">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-mono font-bold mb-1 tracking-tighter text-white uppercase">
                        <TextScramble text="USER_PROFILE" />
                    </h1>
                    <p className="text-muted font-mono text-xs tracking-wide">
                        {`// IDENTITY_AND_SETTINGS`}
                    </p>
                </header>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 pb-16">

                    {/* Left Column: Identity + Stats */}
                    <div className="space-y-6">
                        {/* Hero Identity Card */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-lg overflow-hidden h-full">
                                {/* Top accent line */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                                {/* Background glow */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />

                                <div className="relative p-6">
                                    <div className="flex flex-col gap-6">
                                        {/* Top row: Avatar + Name */}
                                        <div className="flex items-start gap-5">
                                            {/* Avatar */}
                                            <div className="relative group/avatar shrink-0">
                                                <div className="w-20 h-20 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-primary relative overflow-hidden shadow-[0_0_40px_-10px_rgba(255,77,0,0.4)] transition-all duration-300 group-hover/avatar:border-primary/50">
                                                    {formData.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={32} className="opacity-50" />
                                                    )}

                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="absolute inset-0 bg-black/70 flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                                    >
                                                        <Edit2 size={16} className="text-white" />
                                                    </div>

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
                                                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-primary font-mono animate-pulse">UPLOADING...</span>
                                                )}
                                            </div>

                                            {/* Name + Handle */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-xl font-mono font-bold text-white tracking-tight truncate">
                                                        {formData.name || 'Anonymous User'}
                                                    </h2>
                                                    <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                                                        <span className="text-[8px] font-mono uppercase tracking-wider flex items-center gap-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${pendingInfo?.emailConfirmed ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                                            <span className="text-white/60">{pendingInfo?.emailConfirmed ? 'Verified' : 'Unverified'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-muted font-mono text-sm">@{formData.email.split('@')[0]}</p>

                                                {/* Metadata */}
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-white/50 font-mono">
                                                    {formData.title && (
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase size={10} className="text-primary/60" />
                                                            {formData.title}
                                                        </span>
                                                    )}
                                                    {formData.organization && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 size={10} className="text-primary/60" />
                                                            {formData.organization}
                                                        </span>
                                                    )}
                                                    {formData.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={10} className="text-primary/60" />
                                                            {formData.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Edit button */}
                                            {!isEditing && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsEditing(true)}
                                                    leftIcon={<Edit2 size={12} />}
                                                    className="text-[10px] font-mono uppercase tracking-wider hover:bg-white/5 h-8 shrink-0"
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                        </div>

                                        {/* Bio */}
                                        {formData.bio && !isEditing && (
                                            <p className="text-sm text-white/60 font-mono leading-relaxed border-t border-white/5 pt-4">
                                                {formData.bio}
                                            </p>
                                        )}

                                        {/* Edit Form */}
                                        {isEditing && (
                                            <div className="space-y-4 border-t border-white/10 pt-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="font-mono bg-white/5 border-white/10 text-sm"
                                                        placeholder="Display Name"
                                                        leftIcon={<User size={12} />}
                                                    />
                                                    <Input
                                                        value={formData.title}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                        className="font-mono bg-white/5 border-white/10 text-sm"
                                                        placeholder="Title / Role"
                                                        leftIcon={<Briefcase size={12} />}
                                                    />
                                                    <Input
                                                        value={formData.organization}
                                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                                        className="font-mono bg-white/5 border-white/10 text-sm"
                                                        placeholder="Organization"
                                                        leftIcon={<Building2 size={12} />}
                                                    />
                                                    <Input
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        className="font-mono bg-white/5 border-white/10 text-sm"
                                                        placeholder="Location"
                                                        leftIcon={<MapPin size={12} />}
                                                    />
                                                </div>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 text-white font-mono text-sm p-3 outline-none focus:border-primary/50 rounded-sm min-h-[70px] resize-none"
                                                    placeholder="Brief bio..."
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} leftIcon={<X size={12} />} className="text-muted hover:text-white">
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={handleSave} isLoading={isLoading} leftIcon={<Save size={12} />} className="bg-primary hover:bg-primary/90 text-black font-bold">
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Status messages */}
                                        {(profileStatus || profileError) && (
                                            <div className={`p-2 rounded-sm border ${profileStatus ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-error/10 border-error/20 text-error'} font-mono text-[11px] flex items-center gap-2`}>
                                                {profileStatus ? <CheckCircle2 size={12} /> : <Shield size={12} />}
                                                {profileStatus || profileError}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stats Cards */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={14} className="text-primary" />
                                        <span className="text-[9px] font-mono text-muted uppercase">Queries</span>
                                    </div>
                                    <p className="text-xl font-bold font-mono text-white">15<span className="text-muted text-xs">/50</span></p>
                                    <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[30%]" />
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <HardDrive size={14} className="text-blue-400" />
                                        <span className="text-[9px] font-mono text-muted uppercase">Storage</span>
                                    </div>
                                    <p className="text-xl font-bold font-mono text-white">1.2<span className="text-muted text-xs">GB</span></p>
                                    <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[12%]" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-sm p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 size={14} className="text-primary" />
                                        <span className="text-[9px] font-mono text-muted uppercase">Plan</span>
                                    </div>
                                    <p className="text-xl font-bold font-mono text-primary">PRO</p>
                                    <p className="text-[9px] font-mono text-muted mt-1">Active</p>
                                </div>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <button
                                onClick={() => setDangerExpanded(!dangerExpanded)}
                                className="w-full flex items-center justify-between p-3 bg-error/5 border border-error/20 rounded-sm hover:bg-error/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={14} className="text-error" />
                                    <span className="text-xs font-mono text-error uppercase tracking-wider">Danger Zone</span>
                                </div>
                                <ChevronDown size={14} className={`text-error transition-transform ${dangerExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {dangerExpanded && (
                                <div className="animate-in fade-in slide-in-from-top-2 mt-2 bg-error/5 border border-error/20 rounded-sm p-4 space-y-3">
                                    <p className="text-[11px] text-muted font-mono">Permanently delete your account. This cannot be undone.</p>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        placeholder="Type DELETE to confirm"
                                        className="font-mono bg-black/40 border-error/40 text-error placeholder:text-error/60 text-sm"
                                    />
                                    {deleteError && (
                                        <div className="p-2 rounded-sm border border-error/40 bg-error/10 text-error text-[10px] font-mono">{deleteError}</div>
                                    )}
                                    <Button
                                        variant="danger"
                                        className="w-full"
                                        disabled={deleteConfirm.trim().toUpperCase() !== 'DELETE' || isDeleting}
                                        isLoading={isDeleting}
                                        leftIcon={<Trash2 size={12} />}
                                        onClick={handleDeleteAccount}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Tabbed Settings */}
                    <div className="space-y-6">
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                            <div className="bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden h-full">
                                {/* Tab Headers */}
                                <div className="flex border-b border-white/10">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabSelect(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-4 font-mono text-xs uppercase tracking-wider transition-all ${activeTab === tab.id
                                                ? 'bg-white/5 text-white border-b-2 border-primary -mb-px'
                                                : 'text-muted hover:text-white hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            {tab.icon}
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-3 sm:p-4 md:p-6">
                                    <div className={activeTab === 'account' ? 'space-y-6 animate-in fade-in duration-200' : 'hidden'}>
                                        <div>
                                            <h3 className="text-xs font-mono text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Mail size={12} className="text-primary" />
                                                Email Address
                                            </h3>
                                            <div className="bg-white/5 border border-white/10 rounded-sm p-3">
                                                <p className="text-sm font-mono text-white">{formData.email}</p>
                                                <p className="text-[9px] font-mono text-muted mt-1">
                                                    {pendingInfo?.emailConfirmed ? 'Email verified' : 'Email not verified'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <AuthProviders onComplete={refreshUser} />
                                        </div>
                                    </div>

                                    {mountedTabs.security && (
                                        <div className={activeTab === 'security' ? 'animate-in fade-in duration-200' : 'hidden'}>
                                            <h3 className="text-xs font-mono text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Shield size={12} className="text-primary" />
                                                Two-Factor Authentication
                                            </h3>
                                            <MfaSetup onComplete={refreshUser} />
                                        </div>
                                    )}

                                    {mountedTabs.billing && (
                                        <div className={activeTab === 'billing' ? 'animate-in fade-in duration-200' : 'hidden'}>
                                            <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/20 rounded-sm p-3 sm:p-5">
                                                <div className="flex items-start justify-between mb-5">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white font-mono">PRO PLAN</h3>
                                                        <p className="text-[10px] text-primary font-mono uppercase tracking-wider">Active Subscription</p>
                                                    </div>
                                                    <div className="px-2 py-1 bg-primary/20 rounded-sm">
                                                        <span className="text-xs font-mono text-primary font-bold">$29/mo</span>
                                                    </div>
                                                </div>

                                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                                                    {['Unlimited Projects', 'GPT-4 Access', 'Priority Support', 'API Access'].map((feature) => (
                                                        <li key={feature} className="flex items-center gap-2 text-xs text-white/70 font-mono">
                                                            <CheckCircle2 size={12} className="text-primary shrink-0" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <Button className="w-full" variant="secondary">
                                                    Manage Subscription
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
