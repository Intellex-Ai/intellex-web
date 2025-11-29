'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QRCodeCanvas } from 'qrcode.react';

interface MfaSetupProps {
    onComplete?: () => void;
}

export function MfaSetup({ onComplete }: MfaSetupProps) {
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            setError(null);
            setStatus(null);
            const { data: authUser } = await supabase.auth.getUser();
            const userEmail = authUser?.user?.email ?? 'user@intellex.ai';

            const { data: list, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) {
                setError(listError.message ?? 'Failed to load MFA factors');
                return;
            }
            const existing = list?.totp?.find((f) => f.status === 'verified');
            if (existing) {
                setStatus('TOTP already enabled');
                return;
            }

            const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
            if (enrollError) {
                setError(enrollError.message ?? 'Failed to enroll MFA factor');
                return;
            }
            const enrolledFactorId = data?.id ?? null;
            setFactorId(enrolledFactorId);

            // Start a challenge for this factor so we have a challengeId to verify against.
            if (enrolledFactorId) {
                const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                    factorId: enrolledFactorId,
                });
                if (challengeError) {
                    setError(challengeError.message ?? 'Failed to start MFA challenge');
                    return;
                }
                setChallengeId(challengeData?.id ?? null);
            }

            const rawUri = data?.totp?.uri ?? null;
            if (rawUri) {
                // Rebuild the TOTP URI with a stable issuer + user email label.
                try {
                    const parsed = new URL(rawUri.replace('otpauth://', 'http://'));
                    const secret = parsed.searchParams.get('secret') ?? '';
                    const issuer = 'Intellex';
                    const sanitized = `otpauth://totp/${issuer}:${userEmail}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
                    setTotpUri(sanitized);
                } catch {
                    setTotpUri(rawUri);
                }
            } else {
                setTotpUri(null);
            }
            setChallengeId(data?.id ?? null);
        };
        bootstrap();
    }, []);

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!challengeId) {
            setError('Missing challenge ID; try reloading the setup.');
            return;
        }
        if (!factorId) {
            setError('Missing factor ID; try reloading the setup.');
            return;
        }
        setLoading(true);
        setError(null);
        setStatus(null);
        try {
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId,
                code,
            });
            if (verifyError) {
                throw new Error(verifyError.message ?? 'Verification failed');
            }
            setStatus('TOTP enabled. Save your backup codes!');
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-sm">
            <h3 className="text-lg font-mono text-white uppercase">MFA / TOTP</h3>
            {status && <p className="text-xs text-primary font-mono">{status}</p>}
            {error && <p className="text-xs text-error font-mono">{error}</p>}
            {!status && (
                <>
                    <p className="text-sm text-muted">
                        Scan the QR in your authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code to verify. If QR scanning fails, copy the URI below.
                    </p>
                    {totpUri && (
                        <div className="flex flex-col gap-3 items-center">
                            <div className="bg-white p-3 border border-white/10">
                                <QRCodeCanvas value={totpUri} size={180} includeMargin />
                            </div>
                            <div className="bg-black/60 border border-white/10 p-3 rounded-sm break-all text-xs text-muted font-mono w-full">
                                {totpUri}
                            </div>
                        </div>
                    )}
                    <form className="space-y-3" onSubmit={verify}>
                        <Input
                            label="One-time code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                        />
                        <Button type="submit" isLoading={loading} className="w-full">
                            Verify & Enable
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
