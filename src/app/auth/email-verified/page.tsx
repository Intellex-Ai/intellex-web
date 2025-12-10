'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

    const hashParams = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash.replace(/^#/, '');
        return new URLSearchParams(hash);
    }, []);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const verifyEmail = async () => {
            const code = searchParams?.get('code');
            const tokenHash = searchParams?.get('token_hash');
            const type = searchParams?.get('type') || 'signup';
            const errorParam = searchParams?.get('error_description') || searchParams?.get('error');
            // Supabase may also send tokens in hash for certain flows
            const accessToken = hashParams?.get('access_token');
            const refreshToken = hashParams?.get('refresh_token');

            if (errorParam) {
                setError(errorParam);
                setStatus('error');
                return;
            }

            let verified = false;
            let sameDevice = false; // Track if this is the same device that initiated signup

            // Method 1: If we have tokens in hash (implicit flow), set session to verify
            if (accessToken && refreshToken) {
                try {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (!sessionError) {
                        verified = true;
                        // This could be same or different device, assume different to be safe
                        sameDevice = false;
                    }
                } catch {
                    // Continue to try other methods
                }
            }

            // Method 2: If we have token_hash, verify via server-side API (works cross-device)
            if (!verified && tokenHash) {
                try {
                    const res = await fetch('/api/auth/verify-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token_hash: tokenHash, type }),
                    });
                    const data = await res.json();
                    if (data.verified) {
                        verified = true;
                        sameDevice = false; // Server-side verification = different device
                    } else if (data.alreadyUsed) {
                        verified = true;
                        sameDevice = false;
                    }
                } catch {
                    // Continue to try other methods
                }
            }

            // Method 3: If we have a code, try PKCE exchange (works if same browser)
            // This completes the email verification in Supabase
            if (!verified && code) {
                try {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (!exchangeError) {
                        verified = true;
                        // PKCE succeeded = same device/browser (has the code_verifier)
                        // The original signup tab will detect the session via onAuthStateChange
                        sameDevice = true;
                    }
                } catch {
                    // Code exchange failed - this is a different device
                    sameDevice = false;
                }
            }

            // Method 4: If code exchange failed, check if the email param indicates
            // this user's email is now confirmed (the original tab's polling may have
            // already detected and processed the verification)
            const emailParam = searchParams?.get('email');
            if (!verified && emailParam) {
                try {
                    const res = await fetch(`/api/auth/confirm-status?email=${encodeURIComponent(emailParam)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.confirmed) {
                            verified = true;
                            sameDevice = false; // Fallback check = likely different device
                        }
                    }
                } catch {
                    // Non-blocking
                }
            }

            // If this is a different device, sign out to prevent auto-login on "Go to Login"
            // This is safe because the original signup tab is on a different device
            if (verified && !sameDevice) {
                await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            }

            if (verified) {
                setStatus('success');
            } else if (code || tokenHash) {
                // We had a verification link but couldn't verify - likely expired or already used
                setError('This verification link has expired or was already used. If you already verified your email, please sign in.');
                setStatus('error');
            } else {
                setError('Invalid verification link. Please request a new one from the login page.');
                setStatus('error');
            }
        };

        void verifyEmail();
    }, [searchParams, hashParams]);

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
                    <Link href="/login">
                        <Button variant="primary" className="w-full">Go to Login</Button>
                    </Link>
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
