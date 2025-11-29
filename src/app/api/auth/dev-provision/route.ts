import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowDev = process.env.ENABLE_DEV_AUTH_AUTOCONFIRM === 'true';

const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
const serverError = (message: string, detail?: unknown) => NextResponse.json({ error: message, detail }, { status: 500 });

export async function POST(req: NextRequest) {
    if (!allowDev) {
        return NextResponse.json({ error: 'Dev provisioning is disabled' }, { status: 403 });
    }

    if (!supabaseUrl || !serviceKey) {
        return serverError('Supabase service role not configured');
    }

    let payload: { email?: string; password?: string; name?: string };
    try {
        payload = await req.json();
    } catch {
        return badRequest('Invalid JSON payload');
    }

    const { email, password, name } = payload;
    if (!email || !password) {
        return badRequest('email and password are required');
    }

    const admin = createClient(supabaseUrl, serviceKey);

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
        return serverError(message, err instanceof Error ? { name: err.name, message: err.message } : err);
    }
}
