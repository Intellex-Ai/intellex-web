import { NextResponse } from 'next/server';

import { jsonNoStore, requireSupabaseUser } from '@/app/api/_lib/auth';

const BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

const sanitizePreferences = (value: unknown) => {
  if (!value || typeof value !== 'object') return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete (rest as { apiKeys?: unknown }).apiKeys;
  return rest;
};

export async function POST(req: Request) {
  const authed = await requireSupabaseUser(req);
  if (authed instanceof NextResponse) return authed;

  const { admin, user } = authed;

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return jsonNoStore({ error: 'file is required' }, { status: 400 });
  }

  if (!user.email) {
    return jsonNoStore({ error: 'Authenticated user missing email' }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return jsonNoStore({ error: 'File too large' }, { status: 413 });
  }

  if (file.type && !file.type.startsWith('image/')) {
    return jsonNoStore({ error: 'Invalid file type' }, { status: 400 });
  }

  const extRaw = (file.name.split('.').pop() || 'png').toLowerCase();
  const ext = /^[a-z0-9]{1,10}$/.test(extRaw) ? extRaw : 'png';

  try {
    // Ensure bucket exists and is public (ignore if already created)
    await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const { data: existingProfile } = await admin
      .from('users')
      .select('name, preferences')
      .eq('id', user.id)
      .single();

    const displayName =
      (existingProfile?.name as string | undefined) || user.email || 'Intellex User';
    const existingPrefs = (existingProfile?.preferences as Record<string, unknown>) || {};

    const arrayBuffer = await file.arrayBuffer();
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type || 'image/png',
      upsert: true,
    });
    if (uploadErr) {
      return jsonNoStore({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        display_name: displayName,
        avatar_url: publicUrl,
      },
    });
    if (metaErr) {
      return jsonNoStore({ error: 'Failed to update auth profile' }, { status: 500 });
    }

    const mergedPreferences = {
      ...existingPrefs,
      theme: (existingPrefs as { theme?: string }).theme || 'system',
    };

    const { data: profile, error: upsertErr } = await admin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: displayName,
        avatar_url: publicUrl,
        preferences: mergedPreferences,
      })
      .select('id, email, name, avatar_url, preferences')
      .single();
    if (upsertErr) {
      return jsonNoStore({ error: 'Failed to update profile' }, { status: 500 });
    }

    return jsonNoStore(
      {
        avatarUrl: publicUrl,
        user: profile
          ? {
              ...profile,
              preferences: sanitizePreferences(profile.preferences),
            }
          : null,
      },
      { status: 200 }
    );
  } catch {
    return jsonNoStore({ error: 'Upload failed' }, { status: 500 });
  }
}
