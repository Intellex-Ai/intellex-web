import { supabaseAdmin } from '@/lib/supabase/service';
import type { Database } from '@/types/database.types';
import { MODEL_SOURCE_SEED } from '@/lib/model-sources/seed-data';

export type ModelSourceRecord = Database['public']['Tables']['model_sources']['Row'];

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PRIORITY = 5;

let cache:
  | {
      expiresAt: number;
      data: ModelSourceRecord[];
    }
  | null = null;

export async function loadModelSourceRegistry(): Promise<ModelSourceRecord[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  try {
    const rows = await fetchRegistryRows();
    if (rows.length) {
      cache = { data: rows, expiresAt: now + CACHE_TTL_MS };
      return rows;
    }

    await seedModelSourcesTable();

    const seededRows = await fetchRegistryRows();
    if (seededRows.length) {
      cache = { data: seededRows, expiresAt: now + CACHE_TTL_MS };
      return seededRows;
    }
  } catch (error) {
    console.warn('[model-registry] failed to load from Supabase', error);
  }

  const fallback = fallbackModelSources();
  cache = { data: fallback, expiresAt: now + CACHE_TTL_MS };
  return fallback;
}

export function matchModelSources(query: string, registry: ModelSourceRecord[]) {
  const normalized = query.toLowerCase();
  const matches = registry.filter((record) => {
    const keywords = normalizeList(record.keywords);
    return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
  });

  if (matches.length) {
    return matches.sort((a, b) => (b.priority ?? DEFAULT_PRIORITY) - (a.priority ?? DEFAULT_PRIORITY));
  }

  if (normalized.includes('ai')) {
    return registry.slice(0, 5);
  }

  return [];
}

export function findModelByUrl(url: string, registry: ModelSourceRecord[]) {
  const domain = domainFromUrl(url);
  if (!domain) return undefined;

  return registry.find((record) => {
    const primaryDomain = domainFromUrl(record.primary_url);
    if (primaryDomain && domainMatches(domain, primaryDomain)) {
      return true;
    }

    const mirrorHit = normalizeList(record.mirrors).some((mirrorUrl) => {
      const mirrorDomain = domainFromUrl(mirrorUrl);
      return mirrorDomain ? domainMatches(domain, mirrorDomain) : false;
    });

    if (mirrorHit) {
      return true;
    }

    const assetHit = normalizeList(record.mirrored_assets).some((assetUrl) => {
      const assetDomain = domainFromUrl(assetUrl);
      return assetDomain ? domainMatches(domain, assetDomain) : false;
    });

    return assetHit;
  });
}

export function getFallbackQueriesForModel(model?: ModelSourceRecord) {
  if (!model) return [];
  return normalizeList(model.fallback_queries);
}

export function expandMirrorsForModel(originalUrl: string, model?: ModelSourceRecord) {
  const mirrors = normalizeList(model?.mirrors).map((template) => {
    if (template.includes('{{')) {
      return template.replace('{{raw}}', originalUrl).replace('{{encoded}}', encodeURIComponent(originalUrl));
    }
    return template;
  });

  const mirroredAssets = normalizeList(model?.mirrored_assets);
  return [...mirrors, ...mirroredAssets];
}

function fallbackModelSources(): ModelSourceRecord[] {
  return MODEL_SOURCE_SEED.map((entry) => ({
    ...entry,
    created_at: entry.created_at ?? null,
    last_verified_at: entry.last_verified_at ?? null
  })) as ModelSourceRecord[];
}

async function fetchRegistryRows() {
  const { data, error } = await supabaseAdmin.from('model_sources').select('*').order('priority', { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []) as ModelSourceRecord[];
}

async function seedModelSourcesTable() {
  try {
    await supabaseAdmin.from('model_sources').upsert(MODEL_SOURCE_SEED, { onConflict: 'id' });
    console.log('[model-registry] seeded fallback sources');
  } catch (error) {
    console.warn('[model-registry] failed to seed fallback sources', error);
  }
}

function normalizeList(list?: string[] | null) {
  return (list ?? []).filter((entry): entry is string => Boolean(entry));
}

function domainFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function domainMatches(domain: string, candidate: string) {
  return domain === candidate || domain.endsWith(`.${candidate}`);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidModelId(value?: string | null): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
