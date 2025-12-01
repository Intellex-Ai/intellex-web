'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import AuthLayout from '@/components/layout/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase';

function LoginContent() {
    const { user } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/dashboard';

    // If we land on login with MFA flags but no Supabase session, clear stale state so user can start fresh.
    useEffect(() => {
        if (user) return;
        const state = useStore.getState();
        if (state.mfaRequired || state.mfaChallengeId || state.mfaFactorId) {
            supabase.auth.getSession().then(({ data }) => {
                const hasSession = Boolean(data?.session);
                if (!hasSession) {
                    supabase.auth.signOut().catch(() => {});
                    state.clearSession();
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            router.push(redirect);
        }
    }, [user, router, redirect]);

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
