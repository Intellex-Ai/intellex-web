import { NextResponse } from 'next/server';

import { jsonNoStore, requireSupabaseUser } from '@/app/api/_lib/auth';

const PROFILE_SELECT = 'id, email, name, avatar_url, preferences';

const sanitizePreferences = (value: unknown) => {
  if (!value || typeof value !== 'object') return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete (rest as { apiKeys?: unknown }).apiKeys;
  return rest;
};

export async function GET(req: Request) {
  const authed = await requireSupabaseUser(req);
  if (authed instanceof NextResponse) return authed;

  const { admin, user } = authed;

  try {
    const { data: profile, error } = await admin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .single();

    if (error) {
      return jsonNoStore({ user: null }, { status: 200 });
    }

    return jsonNoStore(
      {
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
    return jsonNoStore({ user: null }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const authed = await requireSupabaseUser(req);
  if (authed instanceof NextResponse) return authed;

  const { admin, user } = authed;

  let payload: {
    name?: string;
    avatarUrl?: string;
    title?: string;
    organization?: string;
    location?: string;
    bio?: string;
    timezone?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const name = payload.name?.trim();
  if (!name) {
    return jsonNoStore({ error: 'name is required' }, { status: 400 });
  }

  if (!user.email) {
    return jsonNoStore({ error: 'Authenticated user missing email' }, { status: 400 });
  }

  const title = payload.title?.trim();
  const organization = payload.organization?.trim();
  const location = payload.location?.trim();
  const bio = payload.bio?.trim();
  const timezone = payload.timezone?.trim();

  try {
    const { data: existingProfile } = await admin
      .from('users')
      .select('preferences, avatar_url')
      .eq('id', user.id)
      .single();

    const existingPrefs = (existingProfile?.preferences as Record<string, unknown>) || {};
    const mergedPreferences = {
      ...existingPrefs,
      theme: (existingPrefs as { theme?: string }).theme || 'system',
      ...(timezone ? { timezone } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(organization !== undefined ? { organization } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(bio !== undefined ? { bio } : {}),
    };

    const avatarUrl = payload.avatarUrl ?? existingProfile?.avatar_url ?? null;

    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        display_name: name,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
    });
    if (updateErr) {
      return jsonNoStore({ error: 'Failed to update auth profile' }, { status: 500 });
    }

    const { data: profile, error: upsertErr } = await admin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name,
        avatar_url: avatarUrl,
        preferences: mergedPreferences,
      })
      .select(PROFILE_SELECT)
      .single();

    if (upsertErr) {
      return jsonNoStore({ error: 'Failed to update profile' }, { status: 500 });
    }

    return jsonNoStore(
      {
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
    return jsonNoStore({ error: 'Failed to update profile' }, { status: 500 });
  }
}
