import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabaseServer';

export async function GET() {
    const supabase = await checkSupabaseHealth();
    return NextResponse.json({
        status: supabase.status === 'ok' ? 'ok' : 'degraded',
        supabase,
        timestamp: Date.now(),
    });
}
