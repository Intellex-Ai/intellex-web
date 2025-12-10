const REMOTE_SIGN_OUT_KEY = 'intellex:remote-signed-out';
let remoteSignOutInFlight = false;

export const markRemoteSignOutFlag = (reason?: string) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(REMOTE_SIGN_OUT_KEY, reason || 'signed_out');
    } catch {
        // non-blocking
    }
};

export const consumeRemoteSignOutFlag = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        const val = window.localStorage.getItem(REMOTE_SIGN_OUT_KEY);
        if (val) {
            window.localStorage.removeItem(REMOTE_SIGN_OUT_KEY);
        }
        return val;
    } catch {
        return null;
    }
};

export const clearRemoteSignOutFlag = () => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(REMOTE_SIGN_OUT_KEY);
    } catch {
        // non-blocking
    }
};

export const REMOTE_SIGN_OUT_STORAGE_KEY = REMOTE_SIGN_OUT_KEY;

export const handleRemoteSignOut = async (reason?: string) => {
    if (typeof window === 'undefined') return;
    if (remoteSignOutInFlight) return;
    remoteSignOutInFlight = true;
    try {
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
    } catch {
        // non-blocking
    }
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
        // non-blocking
    }
    markRemoteSignOutFlag(reason);
    try {
        window.location.assign('/session-ended');
    } catch {
        // non-blocking
    } finally {
        // Keep the lock until navigation occurs; it will reset on next page load.
    }
};
