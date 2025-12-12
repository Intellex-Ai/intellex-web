import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const jsonNoStore = (body: unknown, init?: ResponseInit) => {
    const res = NextResponse.json(body, init);
    res.headers.set('Cache-Control', 'no-store');
    return res;
};

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('google_oauth_session');

    if (!sessionCookie?.value) {
        return jsonNoStore({ error: 'No session found' }, { status: 401 });
    }

    try {
        const sessionData = JSON.parse(sessionCookie.value);
        
        // Clear the cookie after reading
        cookieStore.delete('google_oauth_session');

        return jsonNoStore({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
        });
    } catch {
        return jsonNoStore({ error: 'Invalid session data' }, { status: 400 });
    }
}
