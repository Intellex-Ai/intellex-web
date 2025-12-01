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
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
            throw listErr;
        }
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) {
            return NextResponse.json({ error: 'User not found' }, { status: 400 });
        }

        return NextResponse.json({
            user: {
                id: found.id,
                email: found.email,
                email_confirmed: Boolean(found.email_confirmed_at),
                email_confirmed_at: found.email_confirmed_at,
                last_sign_in_at: found.last_sign_in_at,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch pending email status';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
