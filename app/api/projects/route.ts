import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/service';

const requestSchema = z.object({
  title: z.string().min(3),
  query: z.string().min(8),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard')
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { title, query, depth } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ title, query, depth, status: 'queued' })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: 'queued' });
}
