import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/service';
import { runProjectPipeline } from '@/lib/pipeline-overrides/pipeline';

const requestSchema = z.object({
  title: z.string().min(3),
  query: z.string().min(8),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  byok: z
    .object({
      openaiApiKey: z.string().min(16).optional(),
      anthropicApiKey: z.string().min(16).optional(),
      geminiApiKey: z.string().min(8).optional()
    })
    .partial()
    .optional()
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { title, query, depth, byok } = parsed.data;

  const trimmedByok = {
    openaiApiKey: byok?.openaiApiKey?.trim() || undefined,
    anthropicApiKey: byok?.anthropicApiKey?.trim() || undefined,
    geminiApiKey: byok?.geminiApiKey?.trim() || undefined
  };

  let profileId: string | null = null;
  if (trimmedByok.openaiApiKey || trimmedByok.anthropicApiKey || trimmedByok.geminiApiKey) {
    const profileInsert = await supabaseAdmin
      .from('profiles')
      .insert({
        openai_api_key: trimmedByok.openaiApiKey ?? null,
        anthropic_api_key: trimmedByok.anthropicApiKey ?? null,
        gemini_api_key: trimmedByok.geminiApiKey ?? null
      })
      .select('id')
      .single();

    if (profileInsert.error || !profileInsert.data) {
      return NextResponse.json({ error: profileInsert.error?.message ?? 'Failed to store BYOK profile' }, { status: 500 });
    }

    profileId = profileInsert.data.id;
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ title, query, depth, status: 'queued', profile_id: profileId })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    setImmediate(() => {
      runProjectPipeline({ projectId: data.id }).catch((pipelineError) => {
        console.error('runProjectPipeline failed', pipelineError);
      });
    });
  } catch (pipelineError) {
    console.error('failed to schedule pipeline', pipelineError);
    return NextResponse.json(
      { id: data.id, status: 'error', error: (pipelineError as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id, status: 'queued' }, { status: 202 });
}
