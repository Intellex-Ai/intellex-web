import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
    if (!supabaseUrl || !serviceRole) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { token_hash, type } = body;

        if (!token_hash) {
            return NextResponse.json({ error: 'token_hash is required' }, { status: 400 });
        }

        // Use service role client to verify the OTP token
        // This works across devices since it doesn't need the PKCE code_verifier
        const admin = createClient(supabaseUrl, serviceRole, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data, error } = await admin.auth.verifyOtp({
            token_hash,
            type: type || 'signup',
        });

        if (error) {
            // Check if it's an "already verified" type error
            if (error.message?.toLowerCase().includes('expired') || 
                error.message?.toLowerCase().includes('invalid')) {
                return NextResponse.json({ 
                    verified: false, 
                    error: error.message,
                    alreadyUsed: true 
                }, { status: 200 });
            }
            return NextResponse.json({ verified: false, error: error.message }, { status: 200 });
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
