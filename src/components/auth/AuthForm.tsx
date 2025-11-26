'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock } from 'lucide-react';


interface AuthFormProps {
    type: 'login' | 'signup';
}

export default function AuthForm({ type }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const { login } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Mock authentication for now
            await login();
            router.push('/dashboard');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            {error && (
                <div className="p-4 bg-error/10 border-2 border-error text-error rounded-none font-mono text-xs uppercase font-bold">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4">
                <Input
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    leftIcon={<Mail size={16} />}
                />
                <Input
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    leftIcon={<Lock size={16} />}
                />
            </div>

            <Button
                type="submit"
                className="w-full mt-2"
                isLoading={loading}
                size="lg"
            >
                {type === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
        </form>
    );
}
