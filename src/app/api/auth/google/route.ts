import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequestSiteUrl } from '@/lib/site-url';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function GET(req: NextRequest) {
    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    // Determine the callback URL based on the request origin
    const origin = getRequestSiteUrl(req);

    const callbackUrl = `${origin}/api/auth/google/callback`;

    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state and redirect path in a cookie for verification in callback
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_state', JSON.stringify({ state, redirectTo }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    // Build Google OAuth URL
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
    });

    const googleAuthUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    
    return NextResponse.redirect(googleAuthUrl);
}
