import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';

type AuthedUser = {
  id: string;
  email: string | null;
};

export const jsonNoStore = (body: unknown, init?: ResponseInit) => {
  const res = NextResponse.json(body, init);
  res.headers.set('Cache-Control', 'no-store');
  return res;
};

export const parseBearerToken = (authorization: string | null): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
};

export const requireSupabaseUser = async (
  req: Request
): Promise<
  | { admin: SupabaseClient; user: AuthedUser; token: string }
  | ReturnType<typeof jsonNoStore>
> => {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return jsonNoStore(
      { error: 'Supabase service role not configured' },
      { status: 503 }
    );
  }

  const token = parseBearerToken(req.headers.get('authorization'));
  if (!token) {
    return jsonNoStore({ error: 'Missing bearer token' }, { status: 401 });
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return jsonNoStore({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return {
    admin,
    token,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  };
};
