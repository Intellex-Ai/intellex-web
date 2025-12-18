import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SessionUserResult = {
    user: SupabaseUser | null;
    error: Error | null;
};

export const getSessionUser = async (): Promise<SessionUserResult> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        return { user: null, error: sessionError };
    }

    const sessionUser = sessionData?.session?.user ?? null;
    if (sessionUser) {
        return { user: sessionUser, error: null };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
        return { user: null, error };
    }
    return { user: data?.user ?? null, error: null };
};
