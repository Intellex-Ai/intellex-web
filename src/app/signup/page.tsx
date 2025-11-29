'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import AuthLayout from '@/components/layout/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';

function SignupContent() {
    const { user } = useStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/dashboard';

    useEffect(() => {
        if (user) {
            router.push(redirect);
        }
    }, [user, router, redirect]);

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
