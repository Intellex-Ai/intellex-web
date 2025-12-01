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
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) {
            throw error;
        }
        const user = data.users.find((u) => u.email?.toLowerCase() === email);
        if (!user) {
            return NextResponse.json({ confirmed: false, exists: false });
        }
        const confirmed = Boolean(
            (user as { email_confirmed_at?: string | null }).email_confirmed_at || 
            (user as { confirmed_at?: string | null }).confirmed_at
        );
        return NextResponse.json({ confirmed, exists: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check confirmation status';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
