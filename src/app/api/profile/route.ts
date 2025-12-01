import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    if (!email) {
        return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    try {
        const { data: profile, error } = await admin
            .from('users')
            .select('id, email, name, avatar_url, preferences')
            .eq('email', email)
            .single();
        if (error) {
            throw error;
        }
        return NextResponse.json({ user: profile });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch profile';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    let payload: { email?: string; name?: string; avatarUrl?: string; title?: string; organization?: string; location?: string; bio?: string };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim();
    const avatarUrl = payload.avatarUrl;
    const title = payload.title?.trim();
    const organization = payload.organization?.trim();
    const location = payload.location?.trim();
    const bio = payload.bio?.trim();

    if (!email || !name) {
        return NextResponse.json({ error: 'email and name are required' }, { status: 400 });
    }

    try {
        // Find user by email via admin list
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
            throw listErr;
        }
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) {
            return NextResponse.json({ error: 'User not found in auth' }, { status: 400 });
        }

        // Fetch existing preferences to merge profile details without losing theme selection.
        const { data: existingProfile } = await admin
            .from('users')
            .select('preferences')
            .eq('id', found.id)
            .single();

        const existingPrefs = (existingProfile?.preferences as Record<string, unknown>) || {};
        const mergedPreferences = {
            ...existingPrefs,
            theme: (existingPrefs as { theme?: string }).theme || 'system',
            ...(title !== undefined ? { title } : {}),
            ...(organization !== undefined ? { organization } : {}),
            ...(location !== undefined ? { location } : {}),
            ...(bio !== undefined ? { bio } : {}),
        };

        // Update auth metadata (display_name) and avatar if provided
        const { error: updateErr } = await admin.auth.admin.updateUserById(found.id, {
            user_metadata: { display_name: name, avatar_url: avatarUrl },
        });
        if (updateErr) {
            throw updateErr;
        }

        // Upsert profile row
        const { data: profile, error: upsertErr } = await admin
            .from('users')
            .upsert({
                id: found.id,
                email,
                name,
                avatar_url: avatarUrl ?? null,
                preferences: mergedPreferences,
            })
            .select()
            .single();

        if (upsertErr) {
            throw upsertErr;
        }

        return NextResponse.json({ user: profile });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
