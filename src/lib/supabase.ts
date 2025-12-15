import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isPlaceholderConfig = !supabaseUrl || !supabaseKey || supabaseKey.includes('placeholder');
export const supabaseConfigured = !isPlaceholderConfig && Boolean(supabaseUrl && supabaseKey);

type AuthOnlyClient = ReturnType<typeof createClient>;

const createSupabaseClient = (): AuthOnlyClient => {
    if (supabaseConfigured && supabaseUrl && supabaseKey) {
        return createClient(supabaseUrl, supabaseKey);
    }

    // Graceful fallback when env vars aren't set or are using placeholder values (local mocks/offline dev)
    console.warn('Supabase env not configured or using placeholder credentials. Using mock auth client.');

    const mockAuth = {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        resetPasswordForEmail: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        updateUser: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { /* noop */ } } } }),
        mfa: {
            listFactors: async () => ({ data: { totp: [] }, error: { message: 'Supabase not configured' } }),
            enroll: async () => ({ data: { id: '', totp: { uri: '' } }, error: { message: 'Supabase not configured' } }),
            challenge: async () => ({ data: { id: '' }, error: { message: 'Supabase not configured' } }),
            unenroll: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            verify: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        },
        getUserIdentities: async () => ({ data: { identities: [] }, error: null }),
        linkIdentity: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        unlinkIdentity: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    };

    return { auth: mockAuth } as unknown as AuthOnlyClient;
};

export const supabase = createSupabaseClient();
