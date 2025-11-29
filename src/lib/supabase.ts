import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isPlaceholderConfig = !supabaseUrl || !supabaseKey || supabaseKey.includes('placeholder');

type AuthOnlyClient = {
    auth: {
        getSession: () => Promise<{ data: { session: { access_token: string } | null }; error: unknown }>;
        getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
        signOut: () => Promise<{ error: unknown }>;
        signInWithPassword: (params: { email: string; password: string }) => Promise<{ data: { user: unknown } | null; error: unknown }>;
        signUp: (params: { email: string; password: string; options?: unknown }) => Promise<{ data: { user: unknown; session: unknown } | null; error: unknown }>;
    };
};

const createSupabaseClient = (): AuthOnlyClient => {
    if (!isPlaceholderConfig) {
        return createClient(supabaseUrl, supabaseKey);
    }

    // Graceful fallback when env vars aren't set or are using placeholder values (local mocks/offline dev)
    console.warn('Supabase env not configured or using placeholder credentials. Using mock auth client.');

    return {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signOut: async () => ({ error: null }),
            signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
            signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        },
    } as AuthOnlyClient;
};

export const supabase = createSupabaseClient();
