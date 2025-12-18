import { supabase } from '@/lib/supabase';
import { getSessionUser } from '@/lib/auth-user';

type MfaFactorList = Awaited<ReturnType<typeof supabase.auth.mfa.listFactors>>['data'];

const MFA_FACTOR_CACHE_TTL_MS = 60 * 1000;

type CachedMfaFactors = {
    userId: string;
    fetchedAt: number;
    data: MfaFactorList;
};

let cachedMfaFactors: CachedMfaFactors | null = null;

type FetchMfaFactorsOptions = {
    userId?: string;
    forceRefresh?: boolean;
};

export const clearMfaFactorCache = () => {
    cachedMfaFactors = null;
};

export const fetchMfaFactors = async (
    options: FetchMfaFactorsOptions = {},
): Promise<{ data: MfaFactorList | null; error: Error | null }> => {
    const { userId, forceRefresh } = options;
    let resolvedUserId = userId;

    if (!resolvedUserId) {
        const { user, error } = await getSessionUser();
        if (error) {
            return { data: null, error };
        }
        if (!user?.id) {
            return { data: null, error: new Error('Supabase user required for MFA factors') };
        }
        resolvedUserId = user.id;
    }

    const now = Date.now();
    if (
        !forceRefresh &&
        cachedMfaFactors &&
        cachedMfaFactors.userId === resolvedUserId &&
        now - cachedMfaFactors.fetchedAt < MFA_FACTOR_CACHE_TTL_MS
    ) {
        return { data: cachedMfaFactors.data, error: null };
    }

    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
        cachedMfaFactors = { userId: resolvedUserId, fetchedAt: now, data };
    }
    return { data: data ?? null, error: error || null };
};
