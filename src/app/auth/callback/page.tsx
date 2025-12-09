'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { syncSessionCookies } from '@/lib/cookies';

function AuthCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'exchanging' | 'complete'>('idle');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const handleExchange = async () => {
            const redirectTo = searchParams?.get('redirect') || '/dashboard';
            const oauthError = searchParams?.get('error_description') || searchParams?.get('error');
            const code = searchParams?.get('code');

            // In some prod flows the Supabase session is already set (e.g., provider redirects without a code).
            // If a session exists, short-circuit and proceed to the app (after checking MFA).
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session && !code && !oauthError) {
                    await useStore.getState().refreshUser();
                    const { mfaRequired, user } = useStore.getState();
                    setStatus('complete');
                    if (mfaRequired) {
                        router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}&mfa=pending`);
                    } else if (user) {
                        await syncSessionCookies({ accessToken: sessionData.session.access_token, mfaPending: false });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        router.replace(redirectTo);
                    } else {
                        router.replace('/login');
                    }
                    return;
                }
            } catch {
                // non-blocking; fall through to code exchange
            }

            if (oauthError) {
                setError(oauthError);
                return;
            }
            if (!code) {
                setError('Missing authorization code. Please try signing in again.');
                return;
            }

            try {
                setStatus('exchanging');
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    throw new Error(exchangeError.message || 'Unable to complete sign-in.');
                }
                await useStore.getState().refreshUser();
                // Check if MFA is required before redirecting to protected routes
                const { mfaRequired, user } = useStore.getState();
                setStatus('complete');
                if (mfaRequired) {
                    // MFA is pending, redirect to login with the intended destination
                    router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}&mfa=pending`);
                } else if (user) {
                    const { data: refreshed } = await supabase.auth.getSession();
                    await syncSessionCookies({
                        accessToken: refreshed?.session?.access_token ?? null,
                        mfaPending: false,
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    router.replace(redirectTo);
                } else {
                    // No user and no MFA - something went wrong, go to login
                    router.replace('/login');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
            }
        };

        void handleExchange();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center space-y-4">
                {!error ? (
                    <>
                        <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                        <h1 className="text-lg font-mono tracking-widest uppercase">
                            {status === 'exchanging' ? 'Completing sign-in...' : 'Finalizing session'}
                        </h1>
                        <p className="text-sm text-muted">
                            If you are not redirected automatically, check your pop-up blockers or try again.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold">Authentication Error</h1>
                        <p className="text-sm text-muted max-w-md mx-auto">{error}</p>
                        <div className="flex justify-center gap-3">
                            <Link href="/login" className="text-primary underline">Back to login</Link>
                            <Link href="/signup" className="text-primary underline">Create account</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h1 className="text-lg font-mono tracking-widest uppercase">Preparing redirect...</h1>
                </div>
            </div>
        }>
            <AuthCallbackInner />
        </Suspense>
    );
}
