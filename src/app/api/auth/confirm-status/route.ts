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
        const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) {
            throw error;
        }
        const user = data.users.find((u) => u.email?.toLowerCase() === email);
        if (!user) {
            return NextResponse.json({ confirmed: false, exists: false });
        }
        const confirmed = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at || (user as { confirmed_at?: string | null }).confirmed_at);
        return NextResponse.json({ confirmed, exists: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check confirmation status';
        return serverError(message);
    }
}
