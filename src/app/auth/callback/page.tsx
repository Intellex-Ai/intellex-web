'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useStore();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState<string>('Verifying your email...');

    const hashParams = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash.replace(/^#/, '');
        return new URLSearchParams(hash);
    }, []);

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
                setMessage('Email verified. Redirecting to your dashboard...');
                await refreshUser();
                setTimeout(() => router.replace('/dashboard'), 800);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Verification failed.';
                setStatus('error');
                setMessage(msg);
            }
        };

        verify();
    }, [refreshUser, router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-md space-y-4 bg-white/5 border border-white/10 p-6">
                <p className="text-xs font-mono uppercase text-primary">Account Verification</p>
                <h1 className="text-xl font-bold text-white font-mono tracking-tight">Email Confirmation</h1>
                <p className={`text-sm ${status === 'error' ? 'text-error' : 'text-muted'}`}>{message}</p>
                {status === 'pending' && <p className="text-xs text-muted font-mono">Processing...</p>}
                {status === 'success' && <p className="text-xs text-success font-mono">Success</p>}
                {status === 'error' && (
                    <button
                        className="text-xs font-mono text-primary underline"
                        onClick={() => router.replace('/login')}
                        type="button"
                    >
                        Back to login
                    </button>
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
