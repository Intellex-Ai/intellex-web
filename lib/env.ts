import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LLM_PROVIDER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SCRAPER_INVOKE_URL: z.string().url().optional(),
  SCRAPER_TOKEN: z.string().optional()
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const parseOrThrow = <T extends z.ZodTypeAny>(schema: T, value: unknown, label: string): z.infer<T> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables for ${label}: ${parsed.error.message}`);
  }
  return parsed.data;
};

export const getServerEnv = () =>
  parseOrThrow(serverSchema, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SCRAPER_INVOKE_URL: process.env.SCRAPER_INVOKE_URL,
    SCRAPER_TOKEN: process.env.SCRAPER_TOKEN
  }, 'server');

export const getClientEnv = () =>
  parseOrThrow(clientSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }, 'client');
