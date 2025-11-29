'use client';

import { useEffect } from 'react';

/**
 * Some Supabase recovery links may land on the site root with the recovery hash.
 * This client-side guard reroutes those to the reset password page, preserving the hash/search.
 */
export function RecoveryRedirect() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const { hash, search, pathname } = window.location;
        // Only act if we detect a recovery hash and we're not already on the reset page.
        if (pathname.startsWith('/reset-password/update')) return;
        const hasRecovery =
            hash.includes('type=recovery') ||
            hash.includes('recovery') ||
            search.includes('type=recovery');
        if (!hasRecovery) return;

        const target = `/reset-password/update${search}${hash}`;
        window.location.replace(target);
    }, []);

    return null;
}
