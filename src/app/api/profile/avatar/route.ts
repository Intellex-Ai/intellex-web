import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'avatars';

export async function POST(req: Request) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    const form = await req.formData();
    const email = (form.get('email') as string | null)?.trim().toLowerCase();
    const file = form.get('file') as File | null;

    if (!email || !file) {
        return NextResponse.json({ error: 'email and file are required' }, { status: 400 });
    }

    try {
        // Ensure bucket exists and is public (ignore if already created)
        await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

        // Find user
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) throw listErr;
        const found = listData.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) return NextResponse.json({ error: 'User not found' }, { status: 400 });

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
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
