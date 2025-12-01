'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import AuthLayout from '@/components/layout/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase';

const MFA_PENDING_COOKIE = 'mfa_pending';

const clearMfaPendingCookie = () => {
    if (typeof document === 'undefined') return;
    const siteDomain = process.env.NEXT_PUBLIC_SITE_URL
        ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
        : undefined;
    const domainPart = siteDomain ? `; Domain=${siteDomain}` : '';
    const securePart = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${MFA_PENDING_COOKIE}=; path=/; max-age=0; SameSite=Lax${domainPart}${securePart}`;
};

function LoginContent() {
    const { user } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/dashboard';
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // If we land on login with MFA flags but no Supabase session, clear stale state so user can start fresh.
    // This runs synchronously on mount to prevent showing stale MFA form.
    useEffect(() => {
        const checkAndClearStaleState = async () => {
            if (user) {
                setIsCheckingSession(false);
                return;
            }
            const state = useStore.getState();
            if (state.mfaRequired || state.mfaChallengeId || state.mfaFactorId) {
                try {
                    const { data } = await supabase.auth.getSession();
                    const hasSession = Boolean(data?.session);
                    if (!hasSession) {
                        await supabase.auth.signOut().catch(() => {});
                        clearMfaPendingCookie();
                        state.clearSession();
                    }
                } catch {
                    // On error, clear state to be safe
                    clearMfaPendingCookie();
                    state.clearSession();
                }
            }
            setIsCheckingSession(false);
        };
        checkAndClearStaleState();
    }, [user]);

    useEffect(() => {
        if (user) {
            router.push(redirect);
        }
    }, [user, router, redirect]);

    // Prevent flash of MFA form while checking session
    if (isCheckingSession) return null;
    if (user) return null; // Prevent flash of content

    return (
        <AuthLayout title="Welcome Back" subtitle="Enter your credentials">
            <AuthForm type="login" redirectTo={redirect} />
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
