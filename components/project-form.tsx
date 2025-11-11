'use client';

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
  const [title, setTitle] = useState('GenAI safety best practices');
  const [query, setQuery] = useState('What should startups implement to ship trustworthy-genAI features?');
  const [depth, setDepth] = useState<Depth>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, query, depth })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? 'Failed to queue project');
      }

      const { id } = await response.json();
      setMessage(`Project queued! Redirect to /p/${id} once realtime wiring is ready.`);
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
    </form>
  );
}
