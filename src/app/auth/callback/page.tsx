'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

function CallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { refreshUser } = useStore();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [message, setMessage] = useState<string>('Verifying your email...');

    useEffect(() => {
        const code = searchParams?.get('code');
        if (!code) {
            setStatus('error');
            setMessage('Invalid or missing verification code.');
            return;
        }

        const verify = async () => {
            try {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error || !data.session) {
                    throw error || new Error('No session returned.');
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
