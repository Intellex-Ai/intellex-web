export const SESSION_COOKIE = 'intellex_session';
export const MFA_PENDING_COOKIE = 'mfa_pending';

const getSecurePart = () => {
    return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
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
