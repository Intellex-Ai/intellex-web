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
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
            throw listErr;
        }
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) {
            return badRequest('User not found');
        }

        // Return last sign-in and whether email is confirmed.
        return NextResponse.json({
            user: {
                id: found.id,
                email: found.email,
                email_confirmed: found.email_confirmed_at ? true : false,
                email_confirmed_at: found.email_confirmed_at,
                last_sign_in_at: found.last_sign_in_at,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch pending email status';
        return serverError(message);
    }
}
