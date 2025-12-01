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

function SignupContent() {
    const { user } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/dashboard';
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // When landing on signup page, ALWAYS clear any pending MFA state.
    // If user navigated here (back button, direct URL, clicking signup link), they're abandoning the MFA flow.
    // MFA form should only appear AFTER a fresh login attempt triggers it, not on page load.
    useEffect(() => {
        const clearStaleStateAndCheck = async () => {
            const state = useStore.getState();
            
            // Always clear MFA state when landing on signup page - user is starting fresh
            if (state.mfaRequired || state.mfaChallengeId || state.mfaFactorId) {
                clearMfaPendingCookie();
                // Sign out to clear the partial session (authenticated but MFA not verified)
                await supabase.auth.signOut().catch(() => {});
                state.clearSession();
            }
            
            setIsCheckingSession(false);
        };
        clearStaleStateAndCheck();
    }, []); // Run once on mount, not dependent on user state

    useEffect(() => {
        if (user) {
            router.push(redirect);
        }
    }, [user, router, redirect]);

    // Prevent flash of MFA form while checking session
    if (isCheckingSession) return null;
    if (user) return null;

    return (
        <AuthLayout title="Create Account" subtitle="Join the intelligence network">
            <AuthForm type="signup" redirectTo={redirect} />
        </AuthLayout>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupContent />
        </Suspense>
    );
}
