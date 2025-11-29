import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isMissingUrl = !supabaseUrl || supabaseUrl.includes('placeholder');
const isMissingKeys = (!supabaseAnonKey && !supabaseServiceRoleKey) || (supabaseAnonKey?.includes('placeholder') ?? true);

export const isSupabaseConfigured = !isMissingUrl && !isMissingKeys;

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
    if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured');
    }

    const key = supabaseServiceRoleKey || supabaseAnonKey;
    if (!key) {
        throw new Error('Supabase key is not configured');
    }

    if (!serverClient) {
        serverClient = createClient(supabaseUrl, key);
    }

    return serverClient;
}

export async function checkSupabaseHealth() {
    if (!isSupabaseConfigured) {
        return {
            status: 'not_configured',
            reason: 'Supabase env vars missing or placeholder',
            urlPresent: !!supabaseUrl,
            anonKeyPresent: !!supabaseAnonKey,
            serviceRolePresent: !!supabaseServiceRoleKey,
        };
    }

    const client = getSupabaseServerClient();
    try {
        // Try a very small read to validate connectivity/table presence.
        const { data, error } = await client.from('users').select('id').limit(1);
        if (error) {
            throw error;
        }

        return {
            status: 'ok',
            sampleCount: data?.length ?? 0,
            table: 'users',
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { status: 'error', error: message };
    }
}
