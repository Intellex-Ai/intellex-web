'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { AuthService } from '@/services/api/auth';

const SESSION_COOKIE = 'intellex_session';
const setSessionCookie = (isLoggedIn: boolean) => {
    if (typeof document === 'undefined') return;
    const siteDomain = process.env.NEXT_PUBLIC_SITE_URL
        ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
        : undefined;
    const domainPart = siteDomain ? `; Domain=${siteDomain}` : '';
    const securePart = window.location.protocol === 'https:' ? '; Secure' : '';
    if (isLoggedIn) {
        document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${domainPart}${securePart}`;
    } else {
        document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax${domainPart}${securePart}`;
    }
};

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useStore();
    const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'resending'>('pending');
    const [message, setMessage] = useState<string>('Verifying your email...');

    const hashParams = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash.replace(/^#/, '');
        return new URLSearchParams(hash);
    }, []);

    const emailParam = searchParams?.get('email');

    const handleResend = async () => {
        if (!emailParam) {
            setStatus('error');
            setMessage('Cannot resend: email missing from link.');
            return;
        }
        setStatus('resending');
        setMessage('Resending confirmation email...');
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: emailParam,
        });
        if (error) {
            setStatus('error');
            setMessage(error.message || 'Failed to resend confirmation email.');
            return;
        }
        setStatus('pending');
        setMessage('Verification email sent. Check your inbox.');
    };

    useEffect(() => {
        const verify = async () => {
            try {
                const errorParam = searchParams?.get('error') || hashParams?.get('error');
                const errorDesc = searchParams?.get('error_description') || hashParams?.get('error_description');
                if (errorParam) {
                    throw new Error(errorDesc || errorParam);
                }

                const accessToken = hashParams?.get('access_token');
                const refreshToken = hashParams?.get('refresh_token');
                const code = searchParams?.get('code');

                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error || !data.session) {
                        throw error || new Error('No session returned.');
                    }
                } else if (code) {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error || !data.session) {
                        throw error || new Error('No session returned.');
                    }
                } else {
                    throw new Error('Invalid or missing verification token.');
                }
                setStatus('success');
                setMessage('Email verified. We notified your original tab to continue.');
                setSessionCookie(true);
                try {
                    const { data: userData } = await supabase.auth.getUser();
                    const authedUser = userData?.user;
                    if (authedUser?.email) {
                        const displayName =
                            (authedUser.user_metadata as Record<string, unknown>)?.display_name ||
                            (authedUser.email.includes('@') ? authedUser.email.split('@')[0] : authedUser.email);
                        await AuthService.login(authedUser.email, displayName as string | undefined, authedUser.id);
                        // Signal other tabs (especially the signup tab) that verification is complete.
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(
                                'intellex:email-verified',
                                JSON.stringify({
                                    email: authedUser.email,
                                    at: Date.now(),
                                })
                            );
                        }
                    }
                } catch (provisionErr) {
                    console.warn('Post-verification provisioning failed', provisionErr);
                }
                await refreshUser();
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Verification failed.';
                setStatus('error');
                setMessage(msg);
            }
        };

        verify();
    }, [emailParam, hashParams, refreshUser, router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-md space-y-4 bg-white/5 border border-white/10 p-6">
                <p className="text-xs font-mono uppercase text-primary">Account Verification</p>
                <h1 className="text-xl font-bold text-white font-mono tracking-tight">Email Confirmation</h1>
                <p className={`text-sm ${status === 'error' ? 'text-error' : 'text-muted'}`}>{message}</p>
                {status === 'pending' && <p className="text-xs text-muted font-mono">Processing...</p>}
                {status === 'resending' && <p className="text-xs text-muted font-mono">Resending confirmation...</p>}
                {status === 'success' && <p className="text-xs text-success font-mono">Verified. You can close this tab.</p>}
                {status === 'error' && (
                    <div className="space-y-2">
                        <button
                            className="text-xs font-mono text-primary underline"
                            onClick={() => router.replace('/login')}
                            type="button"
                        >
                            Back to login
                        </button>
                        {emailParam && (
                            <button
                                className="text-xs font-mono text-primary underline"
                                onClick={handleResend}
                                type="button"
                            >
                                Resend confirmation to {emailParam}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={null}>
            <CallbackContent />
        </Suspense>
    );
}
