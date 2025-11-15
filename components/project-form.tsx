'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Depth = 'quick' | 'standard' | 'deep';

const depthCopy: Record<Depth, string> = {
  quick: 'Fast 3–4 sources, high-level findings',
  standard: 'Balanced 6–8 sources, citations, actionable next steps',
  deep: 'Full sweep 10+ sources, quotes, verifier sampling'
};

export function ProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState('GenAI safety best practices');
  const [query, setQuery] = useState('What should startups implement to ship trustworthy-genAI features?');
  const [depth, setDepth] = useState<Depth>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showByok, setShowByok] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

     const trimmedOpenAI = openaiKey.trim();
     const trimmedAnthropic = anthropicKey.trim();
     const trimmedGemini = geminiKey.trim();

     const payload: Record<string, unknown> = {
       title,
       query,
       depth
     };

     if (trimmedOpenAI || trimmedAnthropic || trimmedGemini) {
       payload.byok = {
         openaiApiKey: trimmedOpenAI || undefined,
         anthropicApiKey: trimmedAnthropic || undefined,
         geminiApiKey: trimmedGemini || undefined
       };
     }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? 'Failed to queue project');
      }

      const { id } = await response.json();
      setMessage('Intellex is stitching your report…');
      router.push(`/p/${id}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
          Project name
        </label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="AI research brief" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="query" className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
          Research goal
        </label>
        <Textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          placeholder="What do you need Intellex to find?"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Depth</p>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(depthCopy).map(([key, copy]) => {
            const value = key as Depth;
            const isActive = depth === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDepth(value)}
                className={`rounded-3xl border px-4 py-5 text-left transition ${
                  isActive ? 'border-white bg-white/10 text-white' : 'border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                <p className="text-base font-semibold capitalize">{value}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{copy}</p>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="depth" value={depth} />
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-64">
          {isSubmitting ? 'Queuing…' : 'Queue project'}
        </Button>
        {message && <p className="text-sm text-white/70">{message}</p>}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">BYOK (optional)</p>
            <p className="text-sm text-white/70">
              Intellex already routes prompts through GPT-4o mini → Claude 3 Haiku → Gemini Flash → Groq Llama 3.1 → Together Mixtral →
              OpenRouter so no local LLMs are required. Add your own vendor keys to override the mesh or unlock private feeds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowByok((prev) => !prev)}
            className="text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            {showByok ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showByok && (
          <>
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-white/50">Hosted inference order</p>
            <p className="mt-2 text-sm text-white/70">
              Intellex-managed free tiers are used first, then your BYOK keys continue the run when our quotas near exhaustion.
            </p>
          </>
        )}

        {showByok && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="openai-key" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                OpenAI API key
              </label>
              <Input
                id="openai-key"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                type="password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="anthropic-key" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                Anthropic API key
              </label>
              <Input
                id="anthropic-key"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="anthropic_..."
                type="password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="gemini-key" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                Google Gemini key
              </label>
              <Input
                id="gemini-key"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                type="password"
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
