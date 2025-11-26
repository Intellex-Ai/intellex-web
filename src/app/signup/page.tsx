'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import AuthLayout from '@/components/layout/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
    const { user } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user) return null;

    return (
        <AuthLayout title="Create Account" subtitle="Join the intelligence network">
            <AuthForm type="signup" />
        </AuthLayout>
    );
}
