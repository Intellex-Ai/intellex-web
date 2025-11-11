import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { getClientEnv, getServerEnv } from '@/lib/env';

const clientEnv = getClientEnv();
const serverEnv = getServerEnv();

export const supabaseAdmin = createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
