import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';

export const createSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase env vars missing');
  }

  return createServerComponentClient<Database>(
    { cookies },
    {
      supabaseUrl: url,
      supabaseKey: anonKey
    }
  );
};
