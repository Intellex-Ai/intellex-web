import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabaseServer';

const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
const serverError = (message: string) => NextResponse.json({ error: message }, { status: 500 });

export async function GET() {
    if (!isSupabaseConfigured) {
        return serverError('Supabase is not configured');
    }

    const client = getSupabaseServerClient();
    const { data, error } = await client
        .from('users')
        .select('id, email, name, avatar_url, preferences')
        .order('email', { ascending: true })
        .limit(50);

    if (error) {
        return serverError(error.message);
    }

    return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: NextRequest) {
    if (!isSupabaseConfigured) {
        return serverError('Supabase is not configured');
    }

    let payload: { id?: string; email?: string; name?: string; avatarUrl?: string; preferences?: unknown };
    try {
        payload = await req.json();
    } catch {
        return badRequest('Invalid JSON payload');
    }

    if (!payload.email) {
        return badRequest('email is required');
    }

    const client = getSupabaseServerClient();
    const id = payload.id || `user-${crypto.randomUUID()}`;

    const newUser = {
        id,
        email: payload.email,
        name: payload.name || payload.email,
        avatar_url: payload.avatarUrl ?? null,
        preferences: payload.preferences ?? { theme: 'system' },
    };

    const { data, error } = await client
        .from('users')
        .upsert(newUser, { onConflict: 'email' })
        .select()
        .single();

    if (error) {
        return serverError(error.message);
    }

    return NextResponse.json({ user: data }, { status: 201 });
}
