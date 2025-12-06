const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100').replace(/\/$/, '');

type RequestLike = {
    headers: Headers;
};

const buildForwardedOrigin = (req: RequestLike) => {
    const forwardedHost = req.headers.get('x-forwarded-host');
    if (!forwardedHost) return null;
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${forwardedHost}`;
};

export const getRequestSiteUrl = (req: RequestLike) => {
    // Prefer forwarded host (reverse proxy/CDN), then Origin header, then configured fallback.
    const forwardedOrigin = buildForwardedOrigin(req);
    if (forwardedOrigin) return forwardedOrigin;

    const origin = req.headers.get('origin');
    if (origin) return origin.replace(/\/$/, '');

    return configuredSiteUrl;
};

export const getSiteUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/$/, '');
    }
    return configuredSiteUrl;
};
