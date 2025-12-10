'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { consumeRemoteSignOutFlag } from '@/lib/session';

export default function SessionEndedPage() {
    const [reason] = useState<string | null>(() => consumeRemoteSignOutFlag());

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="max-w-md w-full border border-white/10 bg-black/60 p-6 space-y-4 text-center">
                <h1 className="text-xl font-mono font-bold text-white uppercase">Session Ended</h1>
                <p className="text-sm text-muted font-mono">
                    You were signed out because this device&apos;s session was revoked from another login.
                </p>
                {reason && (
                    <p className="text-xs text-muted font-mono bg-white/5 p-2 rounded-sm truncate">
                        {reason}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link href="/login">
                        <Button size="sm">SIGN_IN</Button>
                    </Link>
                    <Link href="/">
                        <Button size="sm" variant="ghost">HOME</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
