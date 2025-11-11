'use client';

import Link from 'next/link';

const stats = [
  { label: 'Agents wired', value: '5' },
  { label: 'Default depth', value: 'Standard' },
  { label: 'Exports', value: 'MD & PDF' }
];

export default function MarketingPage() {
  return (
    <main className="flex flex-col gap-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Intellex</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
          Plan, browse, extract, and synthesize cited research briefs without leaving your browser.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/70">
          Intellex coordinates Planner, Browser, Extractor, Synthesizer, and Verifier agents to deliver trustworthy
          summaries and shareable reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/new"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900"
          >
            Start a project
          </Link>
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white"
          >
            View deployment plan
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-3xl font-semibold text-white">{stat.value}</p>
            <p className="text-sm uppercase tracking-widest text-white/60">{stat.label}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
