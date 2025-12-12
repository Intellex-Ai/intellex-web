import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowDev = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH_AUTOCONFIRM === 'true';

export async function POST(req: NextRequest) {
    if (!allowDev) {
        return NextResponse.json({ error: 'Dev provisioning is disabled' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    let payload: { email?: string; password?: string; name?: string };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { email, password, name } = payload;
    if (!email || !password) {
        return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    try {
        const create = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: name || email },
        });

        if (create.error && create.error.code !== 'email_exists') {
            throw create.error;
        }

        // If already exists, update the user to confirm email and reset password.
        if (create.error && create.error.code === 'email_exists') {
            const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const existing = list.data.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
            if (!existing) {
                throw create.error;
            }
            const update = await admin.auth.admin.updateUserById(existing.id, {
                password,
                email_confirm: true,
                user_metadata: { display_name: name || (existing.user_metadata as Record<string, unknown> | null | undefined)?.display_name || email },
            });
            if (update.error) {
                throw update.error;
            }
        }

        return NextResponse.json({ status: 'ok', email });
    } catch (err) {
        console.error('Dev provision failed', err);
        const message = err instanceof Error ? err.message : 'Provisioning failed';
        const detail = err instanceof Error ? { name: err.name, message: err.message } : err;
        return NextResponse.json({ error: message, detail }, { status: 500 });
    }
}
