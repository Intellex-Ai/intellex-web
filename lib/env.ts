import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  SCRAPER_INVOKE_URL: z.string().url().optional(),
  SCRAPER_TOKEN: z.string().optional(),
  SEARCH_PROVIDER: z.string().optional(),
  SEARCH_API_KEY: z.string().optional()
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
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
    SCRAPER_INVOKE_URL: process.env.SCRAPER_INVOKE_URL,
    SCRAPER_TOKEN: process.env.SCRAPER_TOKEN,
    SEARCH_PROVIDER: process.env.SEARCH_PROVIDER,
    SEARCH_API_KEY: process.env.SEARCH_API_KEY
  }, 'server');

export const getClientEnv = () =>
  parseOrThrow(clientSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }, 'client');
