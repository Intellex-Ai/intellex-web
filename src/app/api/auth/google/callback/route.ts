import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Determine origin for redirects
    const origin = req.headers.get('x-forwarded-host')
        ? `https://${req.headers.get('x-forwarded-host')}`
        : req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

    // Helper to redirect with error
    const redirectWithError = (message: string) => {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
    };

    if (error) {
        return redirectWithError(error);
    }

    if (!code || !state) {
        return redirectWithError('Missing authorization code or state');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return redirectWithError('Server configuration error');
    }

    // Verify state from cookie
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get('google_oauth_state');
    
    if (!stateCookie?.value) {
        return redirectWithError('Invalid session. Please try again.');
    }

    let savedState: { state: string; redirectTo: string };
    try {
        savedState = JSON.parse(stateCookie.value);
    } catch {
        return redirectWithError('Invalid session data. Please try again.');
    }

    if (savedState.state !== state) {
        return redirectWithError('State mismatch. Please try again.');
    }

    // Clear the state cookie
    cookieStore.delete('google_oauth_state');

    const callbackUrl = `${origin}/api/auth/google/callback`;
    const redirectTo = savedState.redirectTo || '/dashboard';

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Google token exchange failed:', errorData);
            return redirectWithError('Failed to authenticate with Google');
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        // Use Supabase signInWithIdToken to authenticate
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: tokens.id_token,
            access_token: tokens.access_token,
        });

        if (supabaseError) {
            console.error('Supabase signInWithIdToken failed:', supabaseError);
            return redirectWithError(supabaseError.message || 'Failed to sign in');
        }

        if (!data.session) {
            return redirectWithError('No session returned from authentication');
        }

        // Redirect to the auth callback page which handles MFA and session setup
        // Pass the session info via a secure, short-lived cookie
        const sessionData = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            redirectTo,
        };

        cookieStore.set('google_oauth_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60, // 1 minute - just enough to complete the redirect
            path: '/',
        });

        // Redirect to a client-side page that will finalize the session
        return NextResponse.redirect(`${origin}/auth/google-callback?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return redirectWithError('Authentication failed. Please try again.');
    }
}
