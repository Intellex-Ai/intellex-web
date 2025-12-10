import { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';

/**
 * Keeps the client store in sync with Supabase auth state.
 * Hydrates the user on mount and reacts to sign-in/out/token refresh.
 */
export const useAuthSync = () => {
    const { refreshUser, clearSession } = useStore();
    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const EXPIRY_GRACE_MS = 5000;

    useEffect(() => {
        const clearExpiryTimer = () => {
            if (expiryTimerRef.current) {
                clearTimeout(expiryTimerRef.current);
                expiryTimerRef.current = null;
            }
        };

        const resetSession = () => {
            clearExpiryTimer();
            clearSession();
        };

        async function handleExpiry() {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data?.session) {
                await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                resetSession();
                return;
            }
            scheduleExpiryCheck(data.session);
        }

        function scheduleExpiryCheck(session?: Session | null) {
            clearExpiryTimer();
            const expiresAt = session?.expires_at;
            if (!expiresAt) return;

            const msUntilExpiry = expiresAt * 1000 - Date.now() - EXPIRY_GRACE_MS;
            if (msUntilExpiry <= 0) {
                void handleExpiry();
                return;
            }
            expiryTimerRef.current = setTimeout(() => {
                void handleExpiry();
            }, msUntilExpiry);
        }

        refreshUser();
        void supabase.auth.getSession().then(({ data }) => scheduleExpiryCheck(data?.session));

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            scheduleExpiryCheck(session);

            const eventName = event as string; // Supabase may emit undocumented strings; widen for safety.

            if (event === 'SIGNED_OUT' || eventName === 'USER_DELETED') {
                resetSession();
                return;
            }
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                refreshUser();
                return;
            }

            if (eventName === 'TOKEN_EXPIRED') {
                resetSession();
            }
        });

        return () => {
            clearExpiryTimer();
            sub?.subscription.unsubscribe();
        };
    }, [clearSession, refreshUser]);
};
