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
    const securePart = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${MFA_PENDING_COOKIE}=; path=/; max-age=0; SameSite=Lax${securePart}`;
};

function LoginContent() {
    const { user } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/dashboard';
    const mfaParam = searchParams?.get('mfa');
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // When landing on login page, check if this is a legitimate MFA redirect or user abandoning flow.
    // If mfa=pending param exists, this is a redirect from OAuth callback for MFA verification - keep state.
    // Otherwise, user navigated here directly (back button, link click) - clear stale MFA state.
    useEffect(() => {
        const handleMfaState = async () => {
            const state = useStore.getState();
            const hasMfaState = state.mfaRequired || state.mfaChallengeId || state.mfaFactorId;
            
            // If mfa=pending param exists and we have MFA state, this is a legitimate MFA flow
            if (mfaParam === 'pending' && hasMfaState) {
                setIsCheckingSession(false);
                return;
            }
            
            // Otherwise, clear any stale MFA state - user is starting fresh
            if (hasMfaState) {
                clearMfaPendingCookie();
                // Sign out to clear the partial session (authenticated but MFA not verified)
                await supabase.auth.signOut().catch(() => {});
                state.clearSession();
            }
            
            setIsCheckingSession(false);
        };
        handleMfaState();
    }, [mfaParam]); // Depend on mfaParam to handle URL changes

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
