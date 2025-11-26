'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import AuthLayout from '@/components/layout/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
    const { user } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user) return null; // Prevent flash of content

    return (
        <AuthLayout title="Welcome Back" subtitle="Enter your credentials">
            <AuthForm type="login" />
        </AuthLayout>
    );
}
