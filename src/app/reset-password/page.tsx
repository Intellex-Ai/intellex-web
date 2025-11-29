'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Mail } from 'lucide-react';

export default function ResetPasswordRequest() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStatus(null);

        try {
            const redirectUrl = `${window.location.origin}/reset-password/update`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            if (resetError) {
                throw resetError;
            }
            setStatus('Reset link sent. Check your email.');
            setTimeout(() => router.push('/login'), 1200);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reset link.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-md space-y-6 bg-white/5 border border-white/10 p-8">
                <div>
                    <p className="text-xs font-mono uppercase text-primary">Password Reset</p>
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight">Request Reset Link</h1>
                    <p className="text-sm text-muted mt-2">
                        Enter your email and we&apos;ll send a secure reset link.
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        leftIcon={<Mail size={16} />}
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                    {status && <p className="text-success text-xs font-mono">{status}</p>}
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Send Reset Link
                    </Button>
                </form>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
