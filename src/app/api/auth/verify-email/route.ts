import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { token_hash, type } = body;

        if (!token_hash) {
            return NextResponse.json({ error: 'token_hash is required' }, { status: 400 });
        }

        const { data, error } = await admin.auth.verifyOtp({
            token_hash,
            type: type || 'signup',
        });

        if (error) {
            const isExpiredOrInvalid = error.message?.toLowerCase().includes('expired') || 
                error.message?.toLowerCase().includes('invalid');
            return NextResponse.json({ 
                verified: false, 
                error: error.message,
                alreadyUsed: isExpiredOrInvalid 
            }, { status: 200 });
        }

        return NextResponse.json({ 
            verified: true, 
            user: data.user ? { 
                id: data.user.id, 
                email: data.user.email,
                email_confirmed_at: data.user.email_confirmed_at 
            } : null 
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
