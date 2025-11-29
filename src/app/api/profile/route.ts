import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
const serverError = (message: string) => NextResponse.json({ error: message }, { status: 500 });

export async function GET(req: Request) {
    if (!supabaseUrl || !serviceRole) {
        return serverError('Supabase service role not configured');
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    if (!email) {
        return badRequest('email is required');
    }

    const admin = createClient(supabaseUrl, serviceRole);
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
        return serverError(message);
    }
}

export async function POST(req: Request) {
    if (!supabaseUrl || !serviceRole) {
        return serverError('Supabase service role not configured');
    }

    let payload: { email?: string; name?: string; avatarUrl?: string; title?: string; organization?: string; location?: string; bio?: string };
    try {
        payload = await req.json();
    } catch {
        return badRequest('Invalid JSON payload');
    }

    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim();
    const avatarUrl = payload.avatarUrl;
    const title = payload.title?.trim();
    const organization = payload.organization?.trim();
    const location = payload.location?.trim();
    const bio = payload.bio?.trim();

    if (!email || !name) {
        return badRequest('email and name are required');
    }

    const admin = createClient(supabaseUrl, serviceRole);

    try {
        // Find user by email via admin list
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
            throw listErr;
        }
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) {
            return badRequest('User not found in auth');
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
        return serverError(message);
    }
}
