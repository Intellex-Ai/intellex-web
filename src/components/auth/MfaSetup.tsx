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
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [allowEnroll, setAllowEnroll] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            setError(null);
            setStatus(null);
            const { data: authUser } = await supabase.auth.getUser();
            const userEmail = authUser?.user?.email ?? 'user@intellex.ai';
            const userLabel = authUser?.user?.user_metadata?.display_name || userEmail;

            const { data: list, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) {
                setError(listError.message ?? 'Failed to load MFA factors');
                return;
            }
            const verified = list?.totp?.find((f) => f.status === 'verified');
            if (verified) {
                setStatus('TOTP enabled');
                setFactorId(verified.id);
                setTotpUri(null);
                return;
            }

            if (!allowEnroll) {
                setStatus('MFA disabled. Enable it again when you are ready.');
                setFactorId(null);
                setTotpUri(null);
                return;
            }

            // Clean up stale unverified factors to avoid friendly-name collisions.
            const existingTotp = list?.totp || [];
            for (const factor of existingTotp) {
                if (factor.status !== 'verified') {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
                }
            }

            const friendlyName = `Intellex TOTP ${Date.now()}`;
            const { data, error: enrollError } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName,
            });
            if (enrollError) {
                setError(enrollError.message ?? 'Failed to enroll MFA factor');
                return;
            }
            const enrolledFactorId = data?.id ?? null;
            setFactorId(enrolledFactorId);

            const rawUri = data?.totp?.uri ?? null;
            if (rawUri) {
                try {
                    const parsed = new URL(rawUri.replace('otpauth://', 'http://'));
                    const secret = parsed.searchParams.get('secret') ?? '';
                    const issuer = 'Intellex';
                    const sanitized = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
                        userLabel
                    )}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
                    setTotpUri(sanitized);
                } catch {
                    setTotpUri(rawUri);
                }
            } else {
                setTotpUri(null);
            }
        };
        bootstrap();
    }, [allowEnroll]);

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) {
            setError('Missing factor ID; try reloading the setup.');
            return;
        }
        setLoading(true);
        setError(null);
        setStatus(null);
        try {
            // Always start a fresh challenge for the factor before verifying.
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId,
            });
            if (challengeError) {
                throw new Error(challengeError.message ?? 'Failed to start MFA challenge');
            }
            const freshChallengeId = challengeData?.id;
            if (!freshChallengeId) {
                throw new Error('Missing challenge ID from server; try again.');
            }

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: freshChallengeId,
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

    const disable = async () => {
        if (!factorId) {
            setError('No MFA factor found to disable.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
            if (unenrollError) {
                throw new Error(unenrollError.message ?? 'Failed to disable MFA');
            }
            setStatus('MFA disabled. Enable it again when you are ready.');
            setFactorId(null);
            setTotpUri(null);
            setCode('');
            setAllowEnroll(false);
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };

    const startEnrollment = () => {
        setAllowEnroll(true);
        setStatus(null);
        setError(null);
    };

    const isEnabled = status?.toLowerCase().includes('enabled');

    return (
        <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-sm">
            <h3 className="text-lg font-mono text-white uppercase">MFA / TOTP</h3>
            {status && <p className="text-xs text-primary font-mono">{status}</p>}
            {error && <p className="text-xs text-error font-mono">{error}</p>}
            {isEnabled && (
                <div className="space-y-3">
                    <p className="text-sm text-muted">
                        MFA is active on your account. Use your authenticator app for sign-in. If you need to remove this factor (for example, device lost), you can disable it below and set it back up later.
                    </p>
                    <Button variant="secondary" className="w-full" isLoading={loading} onClick={disable}>
                        Disable MFA
                    </Button>
                </div>
            )}
            {!isEnabled && !allowEnroll && (
                <div className="space-y-3">
                    <p className="text-sm text-muted">MFA is currently off. Re-enable it to protect your account.</p>
                    <Button variant="primary" className="w-full" onClick={startEnrollment}>
                        Enable MFA
                    </Button>
                </div>
            )}
            {!isEnabled && allowEnroll && (
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
