export const SESSION_COOKIE = 'intellex_session';
export const MFA_PENDING_COOKIE = 'mfa_pending';

const getSecurePart = () => {
    return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
};

type SessionSyncPayload = {
    accessToken?: string | null;
    mfaPending?: boolean;
};

const writeClientCookies = (loggedIn: boolean, mfaPending: boolean) => {
    setSessionCookie(loggedIn && !mfaPending);
    setMfaPendingCookie(mfaPending);
};

export const setSessionCookie = (isLoggedIn: boolean) => {
    if (typeof document === 'undefined') return;
    const securePart = getSecurePart();
    if (isLoggedIn) {
        document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${securePart}`;
    } else {
        document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax${securePart}`;
    }
};

export const setMfaPendingCookie = (pending: boolean) => {
    if (typeof document === 'undefined') return;
    const securePart = getSecurePart();
    if (pending) {
        document.cookie = `${MFA_PENDING_COOKIE}=1; path=/; max-age=${60 * 60}; SameSite=Lax${securePart}`;
    } else {
        document.cookie = `${MFA_PENDING_COOKIE}=; path=/; max-age=0; SameSite=Lax${securePart}`;
    }
};

export const clearMfaPendingCookie = () => {
    setMfaPendingCookie(false);
};

export const clearSessionCookie = () => {
    setSessionCookie(false);
};

export const syncSessionCookies = async ({ accessToken, mfaPending = false }: SessionSyncPayload) => {
    const shouldSetSession = Boolean(accessToken) && !mfaPending;

    try {
        if (typeof fetch !== 'undefined') {
            const method = accessToken ? 'POST' : 'DELETE';
            const res = await fetch('/api/auth/session', {
                method,
                cache: 'no-store',
                headers: accessToken
                    ? {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    }
                    : undefined,
                body: accessToken ? JSON.stringify({ mfaPending }) : undefined,
            });
            if (!res.ok) {
                console.warn('Session cookie sync failed', await res.text().catch(() => ''));
            }
        }
    } catch (err) {
        console.warn('Session cookie sync error', err);
    } finally {
        writeClientCookies(shouldSetSession, mfaPending);
    }
};
