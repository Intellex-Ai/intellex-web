'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Github, Link2, Unlink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { UserIdentity } from '@supabase/supabase-js';

interface AuthProvidersProps {
    onComplete?: () => void;
}

type Provider = 'google' | 'github';

interface ProviderConfig {
    id: Provider;
    name: string;
    icon: React.ReactNode;
}

const PROVIDERS: ProviderConfig[] = [
    {
        id: 'google',
        name: 'Google',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        ),
    },
    {
        id: 'github',
        name: 'GitHub',
        icon: <Github size={16} />,
    },
];

export function AuthProviders({ onComplete }: AuthProvidersProps) {
    const [identities, setIdentities] = useState<UserIdentity[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Provider | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchIdentities = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase.auth.getUserIdentities();
            if (fetchError) {
                throw new Error(fetchError.message ?? 'Failed to load linked accounts');
            }
            setIdentities(data?.identities ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load linked accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIdentities();
    }, []);

    const isProviderLinked = (providerId: Provider): boolean => {
        return identities.some((identity) => identity.provider === providerId);
    };

    const getIdentityForProvider = (providerId: Provider): UserIdentity | undefined => {
        return identities.find((identity) => identity.provider === providerId);
    };

    const handleLink = async (provider: Provider) => {
        setActionLoading(provider);
        setError(null);
        setSuccess(null);
        try {
            const { data, error: linkError } = await supabase.auth.linkIdentity({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/profile`,
                },
            });
            if (linkError) {
                throw new Error(linkError.message ?? `Failed to link ${provider}`);
            }
            // linkIdentity redirects to OAuth flow, so we won't reach here in browser
            if (data?.url) {
                window.location.assign(data.url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to link ${provider}`);
            setActionLoading(null);
        }
    };

    const handleUnlink = async (provider: Provider) => {
        const identity = getIdentityForProvider(provider);
        if (!identity) {
            setError(`No ${provider} account found to unlink`);
            return;
        }

        // Safety check: user must have at least 2 identities to unlink
        if (identities.length <= 1) {
            setError('Cannot unlink your only sign-in method. Link another provider first.');
            return;
        }

        setActionLoading(provider);
        setError(null);
        setSuccess(null);
        try {
            const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
            if (unlinkError) {
                throw new Error(unlinkError.message ?? `Failed to unlink ${provider}`);
            }
            setSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked`);
            await fetchIdentities();
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to unlink ${provider}`);
        } finally {
            setActionLoading(null);
        }
    };

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="relative group">
            {/* Holographic animated gradient border */}
            <div className="absolute -inset-[1px] rounded-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 blur-[2px] group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />

            {/* Main card */}
            <div className="relative bg-black/90 border border-cyan-500/30 p-4 rounded-sm space-y-4 backdrop-blur-sm">
                {/* Header with holographic accent */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-mono text-white uppercase tracking-wider flex items-center gap-2">
                        <Link2 size={18} className="text-cyan-400" />
                        Linked_Accounts
                    </h3>
                    <div className="h-1 w-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                </div>

                {/* Status messages */}
                {error && (
                    <div className="p-2 rounded-sm border border-error/40 bg-error/10 text-error text-[11px] font-mono flex items-center gap-2">
                        <AlertCircle size={12} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-2 rounded-sm border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[11px] font-mono flex items-center gap-2">
                        <CheckCircle2 size={12} />
                        {success}
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={20} className="text-cyan-400 animate-spin" />
                        <span className="ml-2 text-xs font-mono text-muted">Loading accounts...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {PROVIDERS.map((provider) => {
                            const isLinked = isProviderLinked(provider.id);
                            const isLoadingThis = actionLoading === provider.id;

                            return (
                                <div
                                    key={provider.id}
                                    className={`flex items-center justify-between p-3 rounded-sm border transition-all duration-300 ${isLinked
                                            ? 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-sm ${isLinked ? 'bg-cyan-500/10' : 'bg-white/10'}`}>
                                            {provider.icon}
                                        </div>
                                        <div>
                                            <span className="text-sm font-mono text-white">{provider.name}</span>
                                            <p className={`text-[10px] font-mono uppercase tracking-wider ${isLinked ? 'text-cyan-400' : 'text-muted'
                                                }`}>
                                                {isLinked ? '● Connected' : '○ Not linked'}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={isLinked ? 'ghost' : 'secondary'}
                                        onClick={() => isLinked ? handleUnlink(provider.id) : handleLink(provider.id)}
                                        disabled={isLoadingThis || actionLoading !== null}
                                        isLoading={isLoadingThis}
                                        className={`h-8 text-[10px] font-mono uppercase tracking-wider ${isLinked
                                                ? 'text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/30'
                                                : 'border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                                            }`}
                                        leftIcon={isLinked ? <Unlink size={12} /> : <Link2 size={12} />}
                                    >
                                        {isLinked ? 'Unlink' : 'Link'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer info */}
                <p className="text-[10px] text-muted font-mono leading-relaxed border-t border-white/5 pt-3 mt-3">
                    Link multiple accounts for flexible sign-in options. You must keep at least one active sign-in method.
                </p>
            </div>
        </div>
    );
}
