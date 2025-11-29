import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/projects', '/research', '/settings', '/profile'];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p === '/' ? p : `/${p.replace(/^\//, '')}`));

    if (!isProtected) {
        return NextResponse.next();
    }

    // Check for Supabase session cookies
    const hasSession = req.cookies.has('intellex_session');

    if (!hasSession) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/projects/:path*', '/research/:path*', '/settings/:path*', '/profile/:path*'],
};
