'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QRCodeCanvas } from 'qrcode.react';

interface MfaSetupProps {
    onComplete?: () => void;
}

const TOTP_ISSUER = 'Intellex';
const TOTP_CODE_LENGTH = 6;
const TOTP_PERIOD_SECONDS = 30;
const QR_CODE_SIZE = 180;
const FALLBACK_EMAIL = 'user@intellex.ai';

function sanitizeTotpUri(rawUri: string, accountLabel: string) {
    try {
        const parsed = new URL(rawUri.replace('otpauth://', 'http://'));
        const secret = parsed.searchParams.get('secret') ?? '';
        return `otpauth://totp/${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(
            accountLabel
        )}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(TOTP_ISSUER)}&digits=${encodeURIComponent(
            String(TOTP_CODE_LENGTH)
        )}&period=${encodeURIComponent(String(TOTP_PERIOD_SECONDS))}`;
    } catch {
        return rawUri;
    }
}

export function MfaSetup({ onComplete }: MfaSetupProps) {
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
    const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasUnverifiedFactors, setHasUnverifiedFactors] = useState(false);
    const [verifiedFactors, setVerifiedFactors] = useState<Array<{ id: string; factor_type: string; created_at: string; friendly_name?: string }>>([]);

    const loadFactors = useCallback(async () => {
        setError(null);
        const { data: list, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) {
            setError(listError.message ?? 'Failed to load MFA factors');
            return;
        }

        const allFactors = list?.all ?? [];
        const verified = allFactors.filter((factor) => factor.status === 'verified');
        const unverified = allFactors.filter((factor) => factor.status !== 'verified');
        setHasUnverifiedFactors(unverified.length > 0);
        setVerifiedFactors(
            verified.map((factor) => ({
                id: factor.id,
                factor_type: factor.factor_type,
                created_at: factor.created_at,
                friendly_name: factor.friendly_name,
            }))
        );

        if (verified.length > 0) {
            setVerifiedFactorId(verified[0].id);
            setPendingFactorId(null);
            setTotpUri(null);
            setCode('');
            return;
        }

        setVerifiedFactorId(null);
        if (pendingFactorId) {
            const stillExists = unverified.some((factor) => factor.id === pendingFactorId);
            if (!stillExists) {
                setPendingFactorId(null);
                setTotpUri(null);
                setCode('');
            }
        }
    }, [pendingFactorId]);

    useEffect(() => {
        void loadFactors();
    }, [loadFactors]);

    const getUserLabel = async () => {
        const { data: authUser } = await supabase.auth.getUser();
        const userEmail = authUser?.user?.email ?? FALLBACK_EMAIL;
        return authUser?.user?.user_metadata?.display_name || userEmail;
    };

    const startSetup = async () => {
        setLoading(true);
        setError(null);
        setStatus(null);
        try {
            const userLabel = await getUserLabel();
            const { data: list, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) {
                throw new Error(listError.message ?? 'Failed to load MFA factors');
            }

            const allFactors = list?.all ?? [];
            const hasVerified = allFactors.some((factor) => factor.status === 'verified');
            if (hasVerified) {
                await loadFactors();
                throw new Error('MFA is already enabled on this account. Disable an existing factor to continue.');
            }

            const unverifiedFactors = allFactors.filter((factor) => factor.status !== 'verified');
            for (const factor of unverifiedFactors) {
                const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                if (unenrollError) {
                    throw new Error(unenrollError.message ?? 'Failed to clear existing MFA setup');
                }
            }

            const friendlyName = `${TOTP_ISSUER} TOTP ${Date.now()}`;
            const { data, error: enrollError } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName,
            });
            if (enrollError) {
                throw new Error(enrollError.message ?? 'Failed to enroll MFA factor');
            }

            const enrolledFactorId = data?.id;
            if (!enrolledFactorId) {
                throw new Error('Missing factor ID from server; try again.');
            }
            setPendingFactorId(enrolledFactorId);

            const rawUri = data?.totp?.uri ?? null;
            if (!rawUri) {
                throw new Error('Missing TOTP URI from server; try again.');
            }
            setTotpUri(sanitizeTotpUri(rawUri, userLabel));
            setHasUnverifiedFactors(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start MFA setup');
        } finally {
            setLoading(false);
        }
    };

    const verify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingFactorId) {
            setError('Missing factor ID; try reloading the setup.');
            return;
        }
        setLoading(true);
        setError(null);
        setStatus(null);
        try {
            // Always start a fresh challenge for the factor before verifying.
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: pendingFactorId,
            });
            if (challengeError) {
                throw new Error(challengeError.message ?? 'Failed to start MFA challenge');
            }
            const freshChallengeId = challengeData?.id;
            if (!freshChallengeId) {
                throw new Error('Missing challenge ID from server; try again.');
            }

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: pendingFactorId,
                challengeId: freshChallengeId,
                code,
            });
            if (verifyError) {
                throw new Error(verifyError.message ?? 'Verification failed');
            }
            await loadFactors();
            setStatus('TOTP enabled. Save your backup codes!');
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const disable = async (factorId?: string) => {
        const targetFactorId = factorId || verifiedFactorId;
        if (!targetFactorId) {
            setError('No MFA factor found to disable.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: targetFactorId });
            if (unenrollError) {
                throw new Error(unenrollError.message ?? 'Failed to disable MFA');
            }
            setVerifiedFactorId(null);
            setPendingFactorId(null);
            setTotpUri(null);
            setCode('');
            await loadFactors();
            setStatus('MFA disabled. Enable it again when you are ready.');
            onComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };

    const isEnabled = Boolean(verifiedFactorId);
    const showSetup = Boolean(totpUri && pendingFactorId);
    const qrValue = totpUri ?? '';

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
                    {verifiedFactors.length > 0 && (
                        <div className="bg-black/40 border border-white/10 p-3 rounded-sm space-y-2">
                            <p className="text-[11px] font-mono text-muted uppercase tracking-wider">Verified factors</p>
                            <ul className="space-y-2">
                                {verifiedFactors.map((factor) => (
                                    <li key={factor.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="break-all text-xs font-mono text-white/70">
                                            {factor.friendly_name || factor.factor_type} ({factor.factor_type})
                                        </span>
                                        <Button
                                            variant="secondary"
                                            className="w-full sm:w-auto"
                                            isLoading={loading}
                                            onClick={() => disable(factor.id)}
                                        >
                                            Disable
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            {!isEnabled && !showSetup && hasUnverifiedFactors && (
                <div className="space-y-3">
                    <p className="text-sm text-muted">
                        You have an unfinished MFA setup attempt. Restart setup to generate a fresh QR code.
                    </p>
                    <Button variant="primary" className="w-full" isLoading={loading} onClick={startSetup}>
                        Restart Setup
                    </Button>
                </div>
            )}
            {!isEnabled && !showSetup && !hasUnverifiedFactors && (
                <div className="space-y-3">
                    <p className="text-sm text-muted">
                        Add an authenticator app factor to protect your account with time-based one-time passwords (TOTP).
                    </p>
                    <Button variant="primary" className="w-full" isLoading={loading} onClick={startSetup}>
                        Enable MFA
                    </Button>
                </div>
            )}
            {!isEnabled && showSetup && (
                <>
                    <p className="text-sm text-muted">
                        Scan the QR in your authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code to verify. If QR scanning fails, copy the URI below.
                    </p>
                    <div className="flex flex-col gap-3 items-center">
                        <div className="bg-white p-3 border border-white/10">
                            <QRCodeCanvas value={qrValue} size={QR_CODE_SIZE} includeMargin />
                        </div>
                        <div className="bg-black/60 border border-white/10 p-3 rounded-sm break-all text-xs text-muted font-mono w-full">
                            {qrValue}
                        </div>
                        <Button variant="secondary" className="w-full" isLoading={loading} onClick={startSetup}>
                            Regenerate QR
                        </Button>
                    </div>
                    <form className="space-y-3" onSubmit={verify}>
                        <Input
                            label="One-time code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            maxLength={TOTP_CODE_LENGTH}
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
