'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { setSessionCookie } from '@/lib/cookies';

function GoogleCallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'processing' | 'complete' | 'error'>('processing');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const finalizeSession = async () => {
            const redirectTo = searchParams?.get('redirect') || '/dashboard';
            const errorParam = searchParams?.get('error');

            if (errorParam) {
                setError(errorParam);
                setStatus('error');
                return;
            }

            try {
                // Fetch the session data from the cookie via an API call
                const response = await fetch('/api/auth/google/session');
                
                if (!response.ok) {
                    throw new Error('Failed to retrieve session');
                }

                const sessionData = await response.json();

                if (!sessionData.access_token || !sessionData.refresh_token) {
                    throw new Error('Invalid session data');
                }

                // Set the session in Supabase client
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: sessionData.access_token,
                    refresh_token: sessionData.refresh_token,
                });

                if (sessionError) {
                    throw new Error(sessionError.message || 'Failed to set session');
                }

                // Refresh user state which handles MFA checks
                await useStore.getState().refreshUser();

                const { mfaRequired, user } = useStore.getState();
                setStatus('complete');

                if (mfaRequired) {
                    // MFA is required, redirect to login with MFA pending
                    router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}&mfa=pending`);
                } else if (user) {
                    // Explicitly set session cookie before redirect to ensure middleware sees it
                    setSessionCookie(true);
                    // Small delay to ensure cookie is processed before navigation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    router.replace(redirectTo);
                } else {
                    // Something went wrong
                    router.replace('/login');
                }
            } catch (err) {
                console.error('Google callback error:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');
                setStatus('error');
            }
        };

        void finalizeSession();
    }, [router, searchParams]);

    if (status === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h1 className="text-lg font-mono tracking-widest uppercase">Completing sign-in...</h1>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-xl font-bold">Authentication Error</h1>
                    <p className="text-sm text-muted max-w-md mx-auto">{error}</p>
                    <div className="flex justify-center gap-3">
                        <Link href="/login" className="text-primary underline">Back to login</Link>
                        <Link href="/signup" className="text-primary underline">Create account</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                <h1 className="text-lg font-mono tracking-widest uppercase">Redirecting...</h1>
            </div>
        </div>
    );
}

export default function GoogleCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h1 className="text-lg font-mono tracking-widest uppercase">Loading...</h1>
                </div>
            </div>
        }>
            <GoogleCallbackInner />
        </Suspense>
    );
}
