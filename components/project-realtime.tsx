'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ProjectSnapshot, ProjectRow, SourceRow, ReportRow, ProfileRow } from '@/lib/projects/types';

interface ProjectRealtimeProps {
  initial: ProjectSnapshot;
}

function VerifierSummary({
  summary,
  verifiedFacts,
  facts
}: {
  summary: string | null;
  verifiedFacts: number;
  facts: number;
}) {
  if (!facts) {
    return (
      <>
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">Verifier</p>
        <p className="mt-2 text-sm text-white/70">Once Intellex extracts facts, it cross-checks them against sources and scores alignment with your goal.</p>
      </>
    );
  }

  return (
    <>
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">Verifier</p>
      <p className="mt-2 text-sm text-white/80">
        {verifiedFacts}/{facts} fact(s) verified. {summary || 'Verifier did not return extra commentary.'}
      </p>
    </>
  );
}

export function ProjectRealtime({ initial }: ProjectRealtimeProps) {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot>(initial);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`project-${initial.project.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${initial.project.id}` },
        (payload) => {
          if (payload.new) {
            setSnapshot((prev) => ({ ...prev, project: payload.new as ProjectRow }));
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sources', filter: `project_id=eq.${initial.project.id}` }, (payload) => {
        setSnapshot((prev) => ({ ...prev, sources: nextSources(prev.sources, payload as RealtimePostgresChangesPayload<SourceRow>) }));
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facts', filter: `project_id=eq.${initial.project.id}` },
        (payload) => {
          setSnapshot((prev) => ({
            ...prev,
            factsCount: nextFactsCount(prev.factsCount, payload.eventType),
            verifiedFactsCount: nextVerifiedFactsCount(prev.verifiedFactsCount, payload as RealtimePostgresChangesPayload<{ verified?: boolean }>)
          }));
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `project_id=eq.${initial.project.id}` }, (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<ReportRow>;
        if (typedPayload.eventType === 'DELETE') {
          setSnapshot((prev) => ({ ...prev, report: null }));
        } else if (typedPayload.new) {
          setSnapshot((prev) => ({ ...prev, report: typedPayload.new }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.project.id]);

  const fetchedSources = useMemo(
    () => snapshot.sources.filter((source) => source.status === 'fetched'),
    [snapshot.sources]
  );
  const proxiedCount = useMemo(
    () => fetchedSources.filter((source) => source.proxy_used).length,
    [fetchedSources]
  );

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">Project</p>
        <h1 className="text-4xl font-semibold text-white">{snapshot.project.title}</h1>
        <p className="text-lg text-white/70">
          Intellex stitches the planner, browser, extractor, synthesizer, and verifier agents together. Project status:{' '}
          <span className="font-semibold text-white">{snapshot.project.status}</span>
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <ProgressTimeline
            project={snapshot.project}
            sources={snapshot.sources}
            fetchedSources={fetchedSources}
            factsCount={snapshot.factsCount}
            report={snapshot.report}
            proxiedCount={proxiedCount}
            verifiedFactsCount={snapshot.verifiedFactsCount}
          />
        </aside>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <ReportPreview project={snapshot.project} report={snapshot.report} />
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <header className="mb-4 space-y-1">
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Source provenance</p>
            <p className="text-base text-white/70">Monitor retries, proxy usage, and mirror hops per URL.</p>
          </header>
          <SourceList sources={snapshot.sources} factsCount={snapshot.factsCount} verifiedFactsCount={snapshot.verifiedFactsCount} />
        </article>
        <div className="space-y-4">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <VerifierSummary summary={snapshot.project.verifier_summary} verifiedFacts={snapshot.verifiedFactsCount} facts={snapshot.factsCount} />
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <ByokPanel profile={snapshot.profile} />
          </article>
        </div>
      </section>
    </main>
  );
}

function nextSources(current: SourceRow[], payload: RealtimePostgresChangesPayload<SourceRow>) {
  if (payload.eventType === 'INSERT' && payload.new) {
    return sortSources([...current, payload.new]);
  }
  if (payload.eventType === 'UPDATE' && payload.new) {
    return sortSources(current.map((source) => (source.id === payload.new.id ? payload.new : source)));
  }
  if (payload.eventType === 'DELETE' && payload.old) {
    return current.filter((source) => source.id !== payload.old.id);
  }
  return current;
}

function sortSources(sources: SourceRow[]) {
  return [...sources].sort((a, b) => {
    const aDate = a.created_at ?? '';
    const bDate = b.created_at ?? '';
    if (aDate === bDate) return 0;
    return aDate > bDate ? 1 : -1;
  });
}

function nextFactsCount(current: number, eventType: string) {
  if (eventType === 'INSERT') return current + 1;
  if (eventType === 'DELETE') return Math.max(0, current - 1);
  return current;
}

function nextVerifiedFactsCount(
  current: number,
  payload: RealtimePostgresChangesPayload<{ verified?: boolean }>
) {
  if (payload.eventType === 'INSERT' && payload.new?.verified) {
    return current + 1;
  }
  if (payload.eventType === 'DELETE' && payload.old?.verified) {
    return Math.max(0, current - 1);
  }
  if (payload.eventType === 'UPDATE') {
    const becameVerified = payload.new?.verified && !payload.old?.verified;
    const lostVerification = !payload.new?.verified && payload.old?.verified;
    if (becameVerified) return current + 1;
    if (lostVerification) return Math.max(0, current - 1);
  }
  return current;
}

function ProgressTimeline({
  project,
  sources,
  fetchedSources,
  factsCount,
  report,
  proxiedCount,
  verifiedFactsCount
}: {
  project: ProjectRow;
  sources: SourceRow[];
  fetchedSources: SourceRow[];
  factsCount: number;
  report: ReportRow | null;
  proxiedCount: number;
  verifiedFactsCount: number;
}) {
  const steps = [
    {
      label: 'Planner',
      status: stepStatus(Boolean(project.task_graph), project.status),
      description: project.task_graph ? 'Task graph stored in Supabase.' : 'Waiting on planner output.'
    },
    {
      label: 'Browser',
      status: stepStatus(fetchedSources.length > 0, project.status),
      description: `${fetchedSources.length}/${sources.length} sources fetched (${proxiedCount} via proxy/mirror).`
    },
    {
      label: 'Extractor',
      status: stepStatus(factsCount > 0, project.status),
      description: factsCount ? `${factsCount} structured facts captured.` : 'Fact extraction queued.'
    },
    {
      label: 'Synthesizer',
      status: stepStatus(Boolean(report), project.status),
      description: report ? 'Markdown report saved.' : 'Waiting on Synthesizer.'
    },
    {
      label: 'Verifier',
      status: stepStatus(verifiedFactsCount > 0, project.status),
      description: verifiedFactsCount
        ? `${verifiedFactsCount} fact(s) verified via snippet overlap.`
        : 'Verifier sampling queued.'
    }
  ];

  return (
    <ol className="flex flex-col gap-4" aria-label={`Project ${project.id} progress`}>
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

function stepStatus(stepComplete: boolean, status: ProjectRow['status']) {
  if (status === 'error') return 'error';
  if (stepComplete) return 'complete';
  return status === 'running' ? 'active' : 'pending';
}

function ReportPreview({ project, report }: { project: ProjectRow; report: ReportRow | null }) {
  if (!report) {
    return (
      <pre className="whitespace-pre-wrap text-sm text-white/70">
        {`# TL;DR\nIntellex is assembling your research brief for **${project.title}**.\n\nCurrent status: ${project.status}.`}
      </pre>
    );
  }

  return <pre className="whitespace-pre-wrap text-sm text-white/80">{report.markdown}</pre>;
}

function SourceList({
  sources,
  factsCount,
  verifiedFactsCount
}: {
  sources: SourceRow[];
  factsCount: number;
  verifiedFactsCount: number;
}) {
  if (!sources.length) {
    return <p className="text-sm text-white/60">No sources queued yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/80">
        <p className="font-semibold text-white">Verification status</p>
        <p>
          {factsCount ? (
            <>
              {verifiedFactsCount}/{factsCount} fact(s) verified. Intellex confirms snippets by matching source tokens.
            </>
          ) : (
            'Intellex verifies snippets after facts are extracted.'
          )}
        </p>
      </div>
      {sources.map((source) => (
        <article key={source.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-white">{source.title || source.url}</p>
            <p className="text-xs text-white/50 break-all">{source.url}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge label={source.status ?? 'pending'} />
            <Badge label={source.source_type ?? 'scraped'} tone="muted" />
            {source.proxy_used && <Badge label="proxy" tone="accent" />}
            {source.fetch_strategy && <Badge label={source.fetch_strategy} tone="muted" />}
            {source.error_code && <Badge label={`err ${source.error_code}`} tone="danger" />}
            {typeof source.relevance_score === 'number' && (
              <Badge label={`rel ${(source.relevance_score * 100).toFixed(0)}%`} tone={relevanceTone(source.relevance_score)} />
            )}
          </div>
          {source.last_error && <p className="mt-2 text-xs text-red-300">Last error: {source.last_error}</p>}
        </article>
      ))}
    </div>
  );
}

function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'muted' | 'accent' | 'danger' }) {
  const toneClasses: Record<'neutral' | 'muted' | 'accent' | 'danger', string> = {
    neutral: 'bg-white/10 text-white',
    muted: 'bg-white/5 text-white/70',
    accent: 'bg-emerald-500/20 text-emerald-200',
    danger: 'bg-rose-500/10 text-rose-200'
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-widest ${toneClasses[tone]}`}>{label}</span>;
}

function ByokPanel({ profile }: { profile: ProfileRow | null }) {
  if (!profile) {
    return (
      <>
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">BYOK status</p>
        <p className="mt-2 text-base text-white/80">
          Intellex-managed mesh active: GPT-4o mini → Claude 3 Haiku → Gemini Flash → Groq Llama 3.1 → Together Mixtral →
          OpenRouter. Everything runs via hosted APIs—add vendor keys during project setup to override the order or unlock private feeds.
        </p>
      </>
    );
  }

  const vendors = [
    profile.openai_api_key ? 'OpenAI' : null,
    profile.anthropic_api_key ? 'Anthropic' : null,
    profile.gemini_api_key ? 'Google Gemini' : null
  ].filter(Boolean) as string[];

  return (
    <>
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">BYOK status</p>
      <p className="mt-2 text-base text-white">
        Active vendor keys:{' '}
        {vendors.length ? vendors.join(', ') : 'Stored profile missing vendor keys. Update to pull API-sourced metadata.'}
      </p>
      <p className="mt-2 text-sm text-white/70">
        Intellex burns through your keys first, then falls back to GPT-4o mini → Claude 3 Haiku → Gemini Flash → Groq Llama 3.1 →
        Together Mixtral → OpenRouter. No local inference, and every hop is logged in the project timeline.
      </p>
    </>
  );
}

function relevanceTone(score?: number | null): 'neutral' | 'muted' | 'accent' | 'danger' {
  if (score === null || score === undefined) return 'muted';
  if (score >= 0.7) return 'accent';
  if (score >= 0.5) return 'neutral';
  if (score >= 0.35) return 'muted';
  return 'danger';
}
