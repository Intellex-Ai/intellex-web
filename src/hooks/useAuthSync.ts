import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

/**
 * Keeps the client store in sync with Supabase auth state.
 * Hydrates the user on mount and reacts to sign-in/out/token refresh.
 */
export const useAuthSync = () => {
    const { refreshUser, clearSession } = useStore();

    useEffect(() => {
        refreshUser();
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                clearSession();
            }
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                refreshUser();
            }
            const eventName = event as unknown as string;
            if (eventName === 'TOKEN_EXPIRED') {
                clearSession();
            }
        });
        return () => {
            sub?.subscription.unsubscribe();
        };
    }, [clearSession, refreshUser]);
};
