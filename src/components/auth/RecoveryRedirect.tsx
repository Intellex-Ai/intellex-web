'use client';

import { useEffect } from 'react';

/**
 * Supabase recovery links sometimes drop users on the site root with tokens in the hash/query.
 * This guard detects recovery/access tokens immediately (not just after paint) and hard-redirects
 * to the reset password page, preserving tokens.
 */
export function RecoveryRedirect() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const { hash, search, pathname } = window.location;
        const hasRecovery =
            hash.includes('type=recovery') ||
            search.includes('type=recovery');
        if (hasRecovery && !pathname.startsWith('/reset-password/update')) {
            window.location.replace(`/reset-password/update${search}${hash}`);
        }
    }, []);

    return null;
}
