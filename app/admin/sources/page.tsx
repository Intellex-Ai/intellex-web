import { supabaseAdmin } from '@/lib/supabase/service';
import type { SourceRow } from '@/lib/projects/types';
import type { Database } from '@/types/database.types';

type ScrapeEventRow = Database['public']['Tables']['scrape_events']['Row'];

export const dynamic = 'force-dynamic';

export default async function AdminSourcesPage() {
  const [sourcesRes, eventsRes] = await Promise.all([
    supabaseAdmin
      .from('sources')
      .select('id, url, domain, status, attempt_count, fetch_strategy, error_code, last_error, proxy_used, source_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('scrape_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)
  ]);

  const sources = (sourcesRes.data ?? []) as SourceRow[];
  const events = (eventsRes.data ?? []) as ScrapeEventRow[];
  const domainStats = summarizeDomains(sources).slice(0, 8);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <header className="mb-4 space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Top failing domains</p>
          <p className="text-base text-white/70">Use this to justify proxy spend or add mirrors into the registry.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="text-xs uppercase tracking-widest text-white/50">
              <tr>
                <th className="px-2 py-1">Domain</th>
                <th className="px-2 py-1">Failures</th>
                <th className="px-2 py-1">Total</th>
                <th className="px-2 py-1">% Failed</th>
                <th className="px-2 py-1">Proxy hits</th>
                <th className="px-2 py-1">Last error</th>
              </tr>
            </thead>
            <tbody>
              {domainStats.map((stat) => (
                <tr key={stat.domain} className="border-t border-white/10">
                  <td className="px-2 py-2 font-semibold">{stat.domain}</td>
                  <td className="px-2 py-2">{stat.failures}</td>
                  <td className="px-2 py-2">{stat.total}</td>
                  <td className="px-2 py-2">{stat.failureRate.toFixed(0)}%</td>
                  <td className="px-2 py-2">{stat.proxyHits}</td>
                  <td className="px-2 py-2 text-white/60">{stat.lastError ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <header className="mb-4 space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Recent scrape events</p>
          <p className="text-base text-white/70">Raw attempts logged from the Lambda fetcher (direct → proxy → mirror).</p>
        </header>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/50">{new Date(event.created_at ?? '').toLocaleString()}</p>
              <p className="text-sm font-semibold text-white">{event.url}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-white/60">
                <span>Attempt {event.attempt}</span>
                <span>{event.strategy}</span>
                {event.status && <span>Status {event.status}</span>}
              </div>
              {event.error && <p className="text-xs text-rose-300">Error: {event.error}</p>}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function summarizeDomains(sources: SourceRow[]) {
  const map = new Map<
    string,
    { domain: string; failures: number; total: number; proxyHits: number; lastError: string | null }
  >();

  sources.forEach((source) => {
    let domain = source.domain;
    if (!domain) {
      try {
        domain = new URL(source.url).hostname;
      } catch {
        domain = source.url;
      }
    }
    if (!map.has(domain)) {
      map.set(domain, { domain, failures: 0, total: 0, proxyHits: 0, lastError: null });
    }
    const stat = map.get(domain)!;
    stat.total += 1;
    if (source.status !== 'fetched') {
      stat.failures += 1;
      stat.lastError = source.last_error ?? source.status ?? stat.lastError;
    }
    if (source.proxy_used) {
      stat.proxyHits += 1;
    }
  });

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      failureRate: entry.total ? (entry.failures / entry.total) * 100 : 0
    }))
    .sort((a, b) => b.failureRate - a.failureRate);
}
