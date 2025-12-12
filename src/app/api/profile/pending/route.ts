import { NextResponse } from 'next/server';

import { jsonNoStore, requireSupabaseUser } from '@/app/api/_lib/auth';

export async function GET(req: Request) {
  const authed = await requireSupabaseUser(req);
  if (authed instanceof NextResponse) return authed;

  const { admin, user } = authed;

  try {
    const { data, error } = await admin.auth.admin.getUserById(user.id);
    if (error) {
      return jsonNoStore({ error: 'Failed to fetch user status' }, { status: 500 });
    }
    const found = data?.user ?? null;
    if (!found) {
      return jsonNoStore({ error: 'User not found' }, { status: 404 });
    }

    return jsonNoStore(
      {
        user: {
          id: found.id,
          email: found.email,
          email_confirmed: Boolean(found.email_confirmed_at),
          email_confirmed_at: found.email_confirmed_at,
          last_sign_in_at: found.last_sign_in_at,
        },
      },
      { status: 200 }
    );
  } catch {
    return jsonNoStore({ error: 'Failed to fetch user status' }, { status: 500 });
  }
}
