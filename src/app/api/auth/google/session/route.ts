import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('google_oauth_session');

    if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    try {
        const sessionData = JSON.parse(sessionCookie.value);
        
        // Clear the cookie after reading
        cookieStore.delete('google_oauth_session');

        return NextResponse.json({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
        });
    } catch {
        return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }
}
