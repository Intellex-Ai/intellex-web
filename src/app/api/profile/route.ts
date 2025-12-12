import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        // Gracefully degrade when service role is missing in the environment.
        return NextResponse.json({ user: null, warning: 'Supabase service role not configured' }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();
    if (!email && !userId) {
        return NextResponse.json({ error: 'email or userId is required' }, { status: 400 });
    }

    try {
        const query = admin
            .from('users')
            .select('id, email, name, avatar_url, preferences')
            .limit(1);

        if (userId) {
            query.eq('id', userId);
        } else if (email) {
            query.eq('email', email);
        }

        const { data: profile, error } = await query.single();
        if (error) {
            throw error;
        }
        return NextResponse.json({ user: profile });
    } catch (err) {
        // Avoid noisy 500s in clients; return a soft null user with context.
        const message = err instanceof Error ? err.message : 'Failed to fetch profile';
        return NextResponse.json({ user: null, error: message }, { status: 200 });
    }
}

export async function POST(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    let payload: { userId?: string; email?: string; name?: string; avatarUrl?: string; title?: string; organization?: string; location?: string; bio?: string; timezone?: string };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const userId = payload.userId?.trim();
    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim();
    const avatarUrl = payload.avatarUrl;
    const title = payload.title?.trim();
    const organization = payload.organization?.trim();
    const location = payload.location?.trim();
    const bio = payload.bio?.trim();
    const timezone = payload.timezone?.trim();

    if ((!email && !userId) || !name) {
        return NextResponse.json({ error: 'email or userId and name are required' }, { status: 400 });
    }

    try {
        // Find user via admin client using the most reliable identifier available.
        let found = null;
        if (userId) {
            const { data, error } = await admin.auth.admin.getUserById(userId);
            if (error) {
                throw error;
            }
            found = data?.user ?? null;
        } else if (email) {
            const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listErr) {
                throw listErr;
            }
            found = listData.users.find((u) => u.email?.toLowerCase() === email) ?? null;
        }

        if (!found?.id) {
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
            ...(timezone ? { timezone } : {}),
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
                email: email || found.email,
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
