import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const SESSION_COOKIE = 'intellex_session';
const MFA_COOKIE = 'mfa_pending';
const isProd = process.env.NODE_ENV === 'production';

const cookieConfig = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
};

const clearSessionCookies = async () => {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    store.delete(MFA_COOKIE);
};

const parseBearer = (header: string | null): string | null => {
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') return null;
    return token.trim() || null;
};

const verifyToken = async (token: string) => {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return {
            ok: false,
            status: 503,
            message: 'Supabase admin client is not configured',
        };
    }

    const { data, error } = await admin.auth.getUser(token);
    if (error) {
        return {
            ok: false,
            status: 401,
            message: error.message || 'Invalid or expired token',
        };
    }

    return { ok: true, status: 200, userId: data.user?.id ?? null };
};

export async function POST(req: NextRequest) {
    const token = parseBearer(req.headers.get('authorization'));
    if (!token) {
        return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
    }

    let body: { mfaPending?: boolean } = {};
    try {
        body = await req.json();
    } catch {
        // optional body
    }
    const mfaPending = Boolean(body.mfaPending);

    const verified = await verifyToken(token);
    if (!verified.ok) {
        return NextResponse.json({ error: verified.message }, { status: verified.status });
    }

    const store = await cookies();
    const maxAge = mfaPending ? 60 * 10 : 60 * 60 * 24 * 7; // 10 minutes vs 7 days

    if (mfaPending) {
        store.delete(SESSION_COOKIE);
        store.set(MFA_COOKIE, '1', { ...cookieConfig, maxAge });
    } else {
        store.set(SESSION_COOKIE, '1', { ...cookieConfig, maxAge });
        store.delete(MFA_COOKIE);
    }

    return NextResponse.json({
        ok: true,
        userId: verified.userId,
        mfaPending,
    });
}

export async function DELETE() {
    await clearSessionCookies();
    return NextResponse.json({ cleared: true });
}
