'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function EmailVerifiedInner() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState<string | null>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const verifyEmail = async () => {
            const code = searchParams?.get('code');
            const errorParam = searchParams?.get('error_description') || searchParams?.get('error');

            if (errorParam) {
                setError(errorParam);
                setStatus('error');
                return;
            }

            if (!code) {
                setError('Invalid verification link. Please request a new one.');
                setStatus('error');
                return;
            }

            try {
                // Exchange the code to complete email verification
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    throw new Error(exchangeError.message || 'Verification failed.');
                }

                // Immediately sign out - we don't want to create a session on this tab/device
                // The original signup tab will detect verification via polling and handle login
                await supabase.auth.signOut();

                setStatus('success');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
                setStatus('error');
            }
        };

        void verifyEmail();
    }, [searchParams]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h1 className="text-lg font-mono tracking-widest uppercase">Verifying your email...</h1>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-error/10 border border-error/30 flex items-center justify-center">
                        <AlertCircle size={32} className="text-error" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold font-mono tracking-tight">Verification Failed</h1>
                        <p className="text-sm text-muted max-w-sm mx-auto">{error}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href="/signup">
                            <Button variant="primary" className="w-full">Try Again</Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost" className="w-full border border-white/10">Back to Login</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <CheckCircle size={32} className="text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-mono tracking-tight">Email Verified</h1>
                    <p className="text-sm text-muted max-w-sm mx-auto">
                        Your email has been successfully verified. Your account is now active.
                    </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                    <div className="flex items-center gap-3 text-left">
                        <Mail size={20} className="text-primary shrink-0" />
                        <p className="text-xs text-muted">
                            If you signed up in another tab or device, you can close this window. Otherwise, click below to sign in.
                        </p>
                    </div>
                </div>
                <Link href="/login">
                    <Button variant="primary" className="w-full" size="lg">Continue to Login</Button>
                </Link>
            </div>
        </div>
    );
}

export default function EmailVerifiedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/70 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h1 className="text-lg font-mono tracking-widest uppercase">Loading...</h1>
                </div>
            </div>
        }>
            <EmailVerifiedInner />
        </Suspense>
    );
}
