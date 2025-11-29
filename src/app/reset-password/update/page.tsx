'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Lock, Mail } from 'lucide-react';

const SESSION_COOKIE = 'intellex_session';
const setSessionCookie = (isLoggedIn: boolean) => {
    if (typeof document === 'undefined') return;
    const siteDomain = process.env.NEXT_PUBLIC_SITE_URL
        ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
        : undefined;
    const domainPart = siteDomain ? `; Domain=${siteDomain}` : '';
    const securePart = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    if (isLoggedIn) {
        document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${domainPart}${securePart}`;
    } else {
        document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax${domainPart}${securePart}`;
    }
};

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaVerified, setMfaVerified] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
    const [ready, setReady] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const hashParams = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash.replace(/^#/, '');
        return new URLSearchParams(hash);
    }, []);

    const emailParam =
        searchParams?.get('email') ||
        hashParams?.get('email') ||
        (typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('email') || null
            : null);
    useEffect(() => {
        if (emailParam) setEmailInput(emailParam);
    }, [emailParam]);

    useEffect(() => {
        const bootstrapSession = async () => {
            try {
                const errorParam = searchParams?.get('error') || hashParams?.get('error');
                const errorDesc = searchParams?.get('error_description') || hashParams?.get('error_description');
                if (errorParam) {
                    throw new Error(errorDesc || errorParam);
                }

                // Try to hydrate session from hash (Supabase email link style) or PKCE code.
                const accessToken = hashParams?.get('access_token');
                const refreshToken = hashParams?.get('refresh_token');
                const code = searchParams?.get('code');

                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error || !data.session) throw error || new Error('No session returned.');
                } else if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error || !data.session) throw error || new Error('No session returned.');
                } else {
                    const { data } = await supabase.auth.getSession();
                    if (!data.session) {
                        throw new Error('Reset link is invalid or expired.');
                    }
                }

                setSessionCookie(true);
                setReady(true);
            } catch (err) {
                setReady(false);
                setError(err instanceof Error ? err.message : 'Reset link is invalid or expired.');
                setStatus('Link expired or invalid. Request a new reset link below.');
            }
        };

        bootstrapSession();
    }, [hashParams, searchParams]);

    useEffect(() => {
        const prepareMfaChallenge = async () => {
            try {
                const { data, error } = await supabase.auth.mfa.listFactors();
                if (error) {
                    // If MFA APIs fail, allow password reset rather than blocking entirely.
                    console.warn('MFA listFactors error', error);
                    setMfaRequired(false);
                    return;
                }
                const verified = (data?.totp || []).find((f) => f.status === 'verified');
                if (!verified) {
                    setMfaRequired(false);
                    return;
                }
                setMfaRequired(true);
                setMfaVerified(false);
                setMfaFactorId(verified.id);
                const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                    factorId: verified.id,
                });
                if (challengeError || !challengeData?.id) {
                    throw new Error(challengeError?.message || 'Failed to start MFA challenge.');
                }
                setChallengeId(challengeData.id);
            } catch (err) {
                console.warn('MFA challenge prep failed', err);
                setMfaRequired(false);
            }
        };
        if (ready) {
            prepareMfaChallenge();
        }
    }, [ready]);

    const verifyMfaCode = async () => {
        if (!mfaRequired) return true;
        if (mfaVerified) return true;
        if (!mfaFactorId || !challengeId) {
            setError('MFA challenge missing. Refresh and try again.');
            return false;
        }
        if (!mfaCode.trim()) {
            setError('Enter your 6-digit MFA code to continue.');
            return false;
        }
        setIsVerifyingMfa(true);
        setError(null);
        try {
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId,
                code: mfaCode.trim(),
            });
            if (verifyError) {
                throw verifyError;
            }
            setMfaVerified(true);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify MFA code.');
            return false;
        } finally {
            setIsVerifyingMfa(false);
        }
    };

    const restartChallenge = async () => {
        if (!mfaFactorId) return;
        setStatus(null);
        setError(null);
        setMfaVerified(false);
        setMfaCode('');
        const { data, error } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
        if (error || !data?.id) {
            setError(error?.message || 'Failed to refresh MFA challenge. Reload the page and try again.');
            return;
        }
        setChallengeId(data.id);
    };

    const resendResetLink = async () => {
        const targetEmail = emailInput?.trim() || emailParam;
        if (!targetEmail) {
            setError('Enter your email to get a new reset link.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStatus(null);
        try {
            const siteUrl =
                process.env.NEXT_PUBLIC_SITE_URL ||
                (typeof window !== 'undefined' ? window.location.origin : 'https://intellex-web.vercel.app');
            const redirectUrl = `${siteUrl}/reset-password/update`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
                redirectTo: redirectUrl,
            });
            if (resetError) {
                throw resetError;
            }
            setStatus(`New reset link sent to ${targetEmail}. Check your email.`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reset link.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ready) {
            setError('Session not ready. Please reopen the reset link from your email or request a new one below.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStatus(null);
        try {
            const mfaOk = await verifyMfaCode();
            if (!mfaOk) {
                setIsLoading(false);
                return;
            }
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                throw updateError;
            }
            setStatus('Password updated. Redirecting to login...');
            setSessionCookie(false);
            setTimeout(() => router.push('/login'), 1200);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update password.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-md space-y-6 bg-white/5 border border-white/10 p-8">
                <div>
                    <p className="text-xs font-mono uppercase text-primary">Password Reset</p>
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight">Set New Password</h1>
                </div>
                {ready ? (
                    <>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <Input
                                label="New password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock size={16} />}
                            />
                            <Input
                                label="Confirm password"
                                type="password"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock size={16} />}
                            />
                            {mfaRequired && !mfaVerified && (
                                <>
                                    <Input
                                        label="MFA code"
                                        type="text"
                                        required
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        placeholder="123456"
                                        leftIcon={<Lock size={16} />}
                                        maxLength={6}
                                    />
                                    <Button
                                        type="button"
                                        className="w-full"
                                        variant="secondary"
                                        onClick={restartChallenge}
                                        isLoading={isVerifyingMfa}
                                    >
                                        Refresh MFA challenge
                                    </Button>
                                </>
                            )}
                            {error && <p className="text-error text-xs font-mono">{error}</p>}
                            {status && <p className="text-success text-xs font-mono">{status}</p>}
                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Update Password
                            </Button>
                        </form>
                        <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                            Back to Login
                        </Button>
                    </>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-mono text-error">{error || 'Link invalid or expired.'}</p>
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="you@example.com"
                            leftIcon={<Mail size={16} />}
                        />
                        {status && <p className="text-success text-xs font-mono">{status}</p>}
                        <Button type="button" className="w-full" isLoading={isLoading} onClick={resendResetLink}>
                            Send new reset link
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordUpdate() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    );
}
