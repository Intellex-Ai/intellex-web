import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface ProjectPageProps {
  params: { id: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">Project</p>
        <h1 className="text-4xl font-semibold text-white">Intellex report preview</h1>
        <p className="text-lg text-white/70">
          This page will stream planner, browser, extractor, synthesizer, and verifier progress via Supabase Realtime.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <Suspense fallback={<div className="text-white/60">Loading status…</div>}>
            <ProgressTimeline projectId={params.id} />
          </Suspense>
        </aside>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <Suspense fallback={<div className="text-white/60">Loading report…</div>}>
            <ReportPreview projectId={params.id} />
          </Suspense>
        </article>
      </section>
    </main>
  );
}

function ProgressTimeline({ projectId }: { projectId: string }) {
  // Placeholder timeline copy until Supabase realtime wiring exists.
  const steps = [
    { label: 'Planner', status: 'complete', description: 'Generated task graph + topic tree' },
    { label: 'Browser', status: 'active', description: 'Fetching sources via AWS Lambda scraper' },
    { label: 'Extractor', status: 'pending', description: 'Parsing clean text + facts + quotes' },
    { label: 'Synthesizer', status: 'pending', description: 'Composing TL;DR + Key Findings w/ citations' },
    { label: 'Verifier', status: 'pending', description: 'Sampling claims and attaching confidence badges' }
  ];

  return (
    <ol className="flex flex-col gap-4" aria-label={`Project ${projectId} progress`}>
      {steps.map((step) => (
        <li key={step.label} className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">{step.label}</p>
            <span className="text-xs uppercase tracking-widest text-white/50">{step.status}</span>
          </div>
          <p className="text-sm text-white/60">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}

function ReportPreview({ projectId }: { projectId: string }) {
  const placeholder = `# TL;DR\nIntellex is ready to synthesize a cited brief for project **${projectId}**.\n\n## Key Findings\n1. Planner generated a multi-hop task graph covering market, technology, and policy angles.\n2. Browser is crawling sources respecting robots.txt and per-domain rate limits.\n\n## Pros / Cons\n- **Pros:** Modular agents, BYOK LLM providers, Supabase realtime streaming.\n- **Cons:** Waiting on Supabase job queue + AWS Lambda scraper deployment.\n\n## Actionables\n- Wire Supabase service role to /api/projects handler.\n- Deploy scraper Lambda + token auth.\n- Implement extractor + synthesizer workers.\n\n## Open Questions\n- Which BYOK providers should ship at launch?\n- Do we default to free SERP or require user keys?`;

  return (
    <pre className="whitespace-pre-wrap text-sm text-white/80">{placeholder}</pre>
  );
}
