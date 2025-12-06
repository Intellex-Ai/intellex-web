import type { User as SupabaseUser } from '@supabase/supabase-js';

type AuthProfile = {
    name?: string;
    email?: string;
    avatarUrl?: string;
};

const coalesceString = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);

export const extractAuthProfile = (authUser?: SupabaseUser | null): AuthProfile => {
    if (!authUser) return {};

    const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const identityData = Array.isArray(authUser.identities)
        ? authUser.identities
              .map((identity) => identity?.identity_data as Record<string, unknown> | null | undefined)
              .filter(Boolean)
        : [];

    const findFirst = (keys: string[]) => {
        const sources = [metadata, ...identityData];
        for (const source of sources) {
            for (const key of keys) {
                const val = coalesceString(source?.[key]);
                if (val) return val;
            }
        }
        return undefined;
    };

    const name = findFirst(['display_name', 'full_name', 'name', 'user_name', 'preferred_username', 'nickname']);
    const avatarUrl = findFirst(['avatar_url', 'avatar', 'picture', 'profile_image', 'image', 'picture_url']);
    const metaEmail = findFirst(['email']);

    return {
        name,
        email: metaEmail || coalesceString(authUser.email),
        avatarUrl,
    };
};
