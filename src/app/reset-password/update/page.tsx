'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Lock } from 'lucide-react';

export default function ResetPasswordUpdate() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Supabase sets the session from the recovery link; this page simply updates the password.
        supabase.auth.getSession().then(({ data }) => {
            if (!data.session) {
                setError('Reset link is invalid or expired.');
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setStatus(null);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                throw updateError;
            }
            setStatus('Password updated. Redirecting to login...');
            setTimeout(() => router.push('/login'), 1200);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update password.';
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
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight">Set New Password</h1>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input
                        label="New password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock size={16} />}
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        leftIcon={<Lock size={16} />}
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                    {status && <p className="text-success text-xs font-mono">{status}</p>}
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Update Password
                    </Button>
                </form>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                    Back to Login
                </Button>
            </div>
        </div>
    );
}
