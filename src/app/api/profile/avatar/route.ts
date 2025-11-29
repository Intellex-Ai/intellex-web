import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'avatars';

const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
const serverError = (message: string) => NextResponse.json({ error: message }, { status: 500 });

export async function POST(req: Request) {
    if (!supabaseUrl || !serviceRole) {
        return serverError('Supabase service role not configured');
    }

    const form = await req.formData();
    const email = (form.get('email') as string | null)?.trim().toLowerCase();
    const file = form.get('file') as File | null;

    if (!email || !file) {
        return badRequest('email and file are required');
    }

    const admin = createClient(supabaseUrl, serviceRole);

    try {
        // Ensure bucket exists and is public (ignore if already created)
        await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

        // Find user
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) throw listErr;
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) return badRequest('User not found');

        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'png';
        const path = `${found.id}-${Date.now()}.${ext}`;

        const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
            contentType: file.type || 'image/png',
            upsert: true,
        });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        // Update auth metadata (avatar_url)
        const { error: metaErr } = await admin.auth.admin.updateUserById(found.id, {
            user_metadata: {
                display_name: found.user_metadata?.display_name || found.email,
                avatar_url: publicUrl,
            },
        });
        if (metaErr) throw metaErr;

        // Update profile row with avatar_url
        const { data: profile, error: upsertErr } = await admin
            .from('users')
            .upsert({
                id: found.id,
                email,
                name: found.user_metadata?.display_name || found.email,
                avatar_url: publicUrl,
                preferences: { theme: 'system' },
            })
            .select('id, email, name, avatar_url, preferences')
            .single();
        if (upsertErr) throw upsertErr;

        return NextResponse.json({ avatarUrl: publicUrl, user: profile });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        return serverError(message);
    }
}
