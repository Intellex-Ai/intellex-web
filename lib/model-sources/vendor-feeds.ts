import Parser from 'rss-parser';
import { supabaseAdmin } from '@/lib/supabase/service';
import type { ModelSourceRecord } from '@/lib/model-sources/registry';
import { isValidModelId } from '@/lib/model-sources/registry';

const FEED_USER_AGENT =
  process.env.MODEL_FEED_USER_AGENT || 'IntellexFeedBot/1.0 (+https://intellex.ai/contact)';

const parser = new Parser({
  timeout: 10_000,
  requestOptions: {
    headers: {
      'User-Agent': FEED_USER_AGENT,
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
    }
  }
});

export async function refreshModelFeeds(registry: ModelSourceRecord[]) {
  for (const model of registry) {
    if (!model.rss_url) continue;
    const modelId = model.id;
    if (!isValidModelId(modelId)) {
      console.warn('[model-registry] skipping RSS refresh, invalid model id', model.model_name);
      continue;
    }
    if (!(await needsRefresh(model, modelId))) continue;

    try {
      const feed = await parser.parseURL(model.rss_url);
      const entry = pickEntry(feed.items ?? [], model);
      if (!entry) continue;

      const version = entry.title ?? entry.link ?? `rss-${Date.now()}`;
      const exists = await supabaseAdmin
        .from('model_releases')
        .select('id')
        .eq('model_source_id', modelId)
        .eq('version', version)
        .maybeSingle();

      if (exists.data) {
        continue;
      }

      await supabaseAdmin.from('model_releases').insert({
        model_source_id: modelId,
        version,
        release_date: entry.isoDate ?? entry.pubDate ?? new Date().toISOString(),
        summary: entry.contentSnippet ?? entry.content ?? entry.title ?? '',
        payload: {
          link: entry.link ?? null,
          title: entry.title ?? null
        }
      });
    } catch (error) {
      console.warn('[model-registry] rss refresh failed', model.model_name, error);
    }
  }
}

async function needsRefresh(model: ModelSourceRecord, modelId: string) {
  const freshnessMs = (model.freshness_interval_hours ?? 168) * 60 * 60 * 1000;
  const { data } = await supabaseAdmin
    .from('model_releases')
    .select('release_date')
    .eq('model_source_id', modelId)
    .order('release_date', { ascending: false })
    .limit(1);

  if (!data || !data[0]?.release_date) {
    return true;
  }

  const last = new Date(data[0].release_date).getTime();
  return Number.isFinite(last) ? Date.now() - last > freshnessMs : true;
}

function pickEntry(
  items: Parser.Item[],
  model: ModelSourceRecord
): Parser.Item | undefined {
  const keywords = new Set((model.keywords ?? []).map((keyword) => keyword.toLowerCase()));
  return (
    items.find((item) => {
      const haystack = `${item.title ?? ''} ${item.contentSnippet ?? ''}`.toLowerCase();
      return Array.from(keywords).some((keyword) => keyword && haystack.includes(keyword));
    }) ?? items[0]
  );
}
