import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/projects', '/research', '/settings', '/profile'];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p === '/' ? p : `/${p.replace(/^\//, '')}`));

    if (!isProtected) {
        return NextResponse.next();
    }

    // Check for session cookie and MFA pending state
    const hasSession = req.cookies.has('intellex_session');
    const mfaPending = req.cookies.has('mfa_pending');

    // Block access if no session OR if MFA is pending (user hasn't completed MFA verification)
    if (!hasSession || mfaPending) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store');
    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/projects/:path*', '/research/:path*', '/settings/:path*', '/profile/:path*'],
};
