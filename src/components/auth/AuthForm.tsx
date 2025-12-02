'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, Github, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuthSync } from '@/hooks/useAuthSync';
import { setSessionCookie } from '@/lib/cookies';


interface AuthFormProps {
    type: 'login' | 'signup';
    redirectTo?: string;
}

export default function AuthForm({ type, redirectTo = '/dashboard' }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [awaitingVerification, setAwaitingVerification] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
    const router = useRouter();
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const mfaInputRef = useRef<HTMLInputElement>(null);

    const { login, loginWithProvider, verifyMfa, mfaRequired, user } = useStore();
    const redirectDest = redirectTo || '/dashboard';

    // Sync auth state across tabs - when email is verified in another tab,
    // Supabase fires SIGNED_IN event which triggers refreshUser and updates the user state
    useAuthSync();

    // When user state changes (e.g., from useAuthSync detecting a session), redirect to dashboard
    useEffect(() => {
        if (user && !mfaRequired) {
            setSessionCookie(true);
            // Small delay to ensure cookie is processed before navigation
            setTimeout(() => router.replace(redirectDest), 100);
        }
    }, [user, mfaRequired, router, redirectDest]);

    // Detect a verified session created in another tab (e.g., after clicking the email link) and refresh only when no MFA is pending.
    useEffect(() => {
        let active = true;
        const maybeRefresh = async () => {
            const state = useStore.getState();
            if (state.mfaRequired || state.mfaChallengeId) return;
            try {
                await useStore.getState().refreshUser();
            } catch {
                // non-blocking
            }
            if (!active) return;
            const refreshedUser = useStore.getState().user;
            if (refreshedUser) {
                setSessionCookie(true);
                setTimeout(() => router.replace(redirectDest), 100);
            }
        };

        const onStorage = (event: StorageEvent) => {
            if (!active) return;
            if ((event.key && event.key.startsWith('sb-')) || event.key === 'intellex:email-verified') {
                void maybeRefresh();
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', onStorage);
        }

        return () => {
            active = false;
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', onStorage);
            }
        };
    }, [redirectDest, router]);

    const startVerificationWatch = (targetEmail: string, pwd: string, providedName?: string) => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setAwaitingVerification(true);
        setVerificationMessage('Waiting for verification... check your inbox.');

        const poll = async () => {
            try {
                const res = await fetch(`/api/auth/confirm-status?email=${encodeURIComponent(targetEmail)}`);
                if (!res.ok) return;
                const data = (await res.json()) as { confirmed?: boolean };
                if (data.confirmed) {
                    setVerificationMessage('Verified. Signing you in...');
                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                    try {
                        const success = await login(targetEmail, pwd, providedName, 'login');
                        const nextMfa = useStore.getState().mfaRequired;
                        if (success && !nextMfa) {
                            setSessionCookie(true);
                            setTimeout(() => router.push(redirectDest), 100);
                        }
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Sign-in after verification failed.');
                        setAwaitingVerification(false);
                    }
                }
            } catch (err) {
                console.warn('Verification poll failed', err);
            }
        };

        poll();
        pollRef.current = setInterval(poll, 4000);
    };

    useEffect(() => {
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
            }
        };
    }, []);

    // Auto-focus MFA input on number keypress
    useEffect(() => {
        if (!mfaRequired) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if the key is a number (0-9)
            if (/^[0-9]$/.test(e.key) && mfaInputRef.current) {
                // Only focus if not already focused on the input
                if (document.activeElement !== mfaInputRef.current) {
                    mfaInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        
        // Auto-focus on mount when MFA is required
        if (mfaInputRef.current) {
            mfaInputRef.current.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mfaRequired]);

    const handleProvider = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError(null);
        try {
            await loginWithProvider(provider, redirectDest);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start sign-in.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userEmail = email.trim();
            const providedName = name.trim();
            const safePassword = password.trim();

            if (!userEmail || !safePassword) {
                throw new Error('Email and password are required.');
            }
            if (type === 'signup' && !providedName) {
                throw new Error('Please provide your name to continue.');
            }

            const displayName = providedName || undefined;
            const success = await login(userEmail, safePassword, displayName, type);
            const nextMfa = useStore.getState().mfaRequired;
            if (success && !nextMfa) {
                setSessionCookie(true);
                setTimeout(() => router.push(redirectDest), 100);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(msg);

            // For signup flows, begin polling for cross-device verification instead of relying on local storage.
            if (type === 'signup' && msg.toLowerCase().includes('confirm')) {
                startVerificationWatch(email.trim(), password.trim(), name.trim() || undefined);
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMfaChange = (value: string) => {
        // Strip non-digits to keep MFA input numeric only
        const digitsOnly = value.replace(/\D/g, '');
        setMfaCode(digitsOnly);
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await verifyMfa(mfaCode.trim());
            setSessionCookie(true);
            setTimeout(() => router.replace(redirectDest), 100);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {!mfaRequired && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="secondary"
                            className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                            leftIcon={<Github size={16} />}
                            onClick={() => handleProvider('github')}
                            disabled={loading}
                        >
                            GITHUB
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                            onClick={() => handleProvider('google')}
                            disabled={loading}
                            leftIcon={
                                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            }
                        >
                            GOOGLE
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 my-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs uppercase text-muted font-mono whitespace-nowrap">Or continue with</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                </>
            )}

            {!mfaRequired ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {error && (
                        <div className="p-3 bg-error/10 border border-error text-error text-xs font-mono uppercase">
                            {error}
                        </div>
                    )}
                    {awaitingVerification && (
                        <div className="p-3 bg-white/5 border border-white/10 text-primary text-xs font-mono uppercase flex items-center gap-3">
                            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span>{verificationMessage || 'Waiting for verification...'}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        {type === 'signup' && (
                            <Input
                                type="text"
                                label="Full name"
                                placeholder="COMMANDER DATA"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={type === 'signup'}
                                leftIcon={<UserIcon size={16} />}
                            />
                        )}
                        <Input
                            type="email"
                            label="Email address"
                            placeholder="OPERATIVE@INTELLEX.AI"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            leftIcon={<Mail size={16} />}
                        />
                        <Input
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            leftIcon={<Lock size={16} />}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-1"
                        isLoading={loading}
                        size="lg"
                        variant="primary"
                    >
                        {type === 'login' ? 'INITIATE_SESSION' : 'CREATE_IDENTITY'}
                    </Button>

                    {type === 'login' && (
                        <div className="text-right">
                            <Link href="/reset-password" className="text-xs font-mono text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    )}

                    <div className="relative mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                                {type === 'login' ? "New to the network?" : "Returning operative?"}
                            </span>
                            <a
                                href={type === 'login' ? '/signup' : '/login'}
                                className="w-full"
                            >
                                <Button variant="ghost" className="w-full border border-white/10 hover:border-primary/50 h-10" type="button">
                                    {type === 'login' ? 'ESTABLISH IDENTITY' : 'ACCESS TERMINAL'}
                                </Button>
                            </a>
                        </div>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyMfa} className="flex flex-col gap-3">
                    {error && (
                        <div className="p-3 bg-error/10 border border-error text-error text-xs font-mono uppercase">
                            {error}
                        </div>
                    )}
                    <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        label="MFA code"
                        placeholder="123456"
                        value={mfaCode}
                        onChange={(e) => handleMfaChange(e.target.value)}
                        required
                        leftIcon={<Lock size={16} />}
                        ref={mfaInputRef}
                    />
                    <Button type="submit" className="w-full mt-1" isLoading={loading} size="lg" variant="primary">
                        Verify MFA
                    </Button>
                    <p className="text-xs font-mono text-muted">
                        Enter the 6-digit code from your authenticator app to complete sign-in.
                    </p>
                </form>
            )}
        </div>
    );
}
