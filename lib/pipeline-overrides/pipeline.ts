import type { PostgrestError } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/service';
import { generate, type ProviderOverrides } from '@/lib/llm';
import { plannerPrompt } from '@/lib/llm/prompts';
import { searchWeb } from '@/lib/search';
import type { SearchResult } from '@/lib/search';
import { invokeScraper } from '@/lib/scraper/client';
import { parseHtml } from '@/lib/parsers/readability';
import { heuristicFacts } from '@/lib/parsers/extractors';
import type { Database, Json } from '@/types/database.types';
import type { ModelSourceRecord } from '@/lib/model-sources/registry';
import {
  expandMirrorsForModel,
  findModelByUrl,
  getFallbackQueriesForModel,
  loadModelSourceRegistry,
  matchModelSources,
  isValidModelId
} from '@/lib/model-sources/registry';
import { refreshModelFeeds } from '@/lib/model-sources/vendor-feeds';
import { scheduleHeadlessSnapshot } from '@/lib/scraper/headless';
import { verifyFactsAgainstSource } from '@/lib/verifier/token-match';
import { assessGoalCoverage, type GoalAssessment } from '@/lib/verifier/goal-check';

type Depth = 'quick' | 'standard' | 'deep';

interface RunProjectPipelineArgs {
  projectId: string;
  requestId?: string | null;
}

type TaskGraph = Record<string, unknown>;
type ModelReleaseRow = Database['public']['Tables']['model_releases']['Row'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type SourceInsertPayload = Database['public']['Tables']['sources']['Insert'];
type SourceUpdatePayload = Database['public']['Tables']['sources']['Update'];

interface SourceMeta {
  id: string;
  title: string;
  url: string;
  type?: string | null;
}

interface ReportFact {
  sourceId: string;
  content: string;
}

type FetchStrategyName = 'direct' | 'alt' | 'mirror' | 'proxy';
type SourceType = 'scraped' | 'mirror' | 'proxy' | 'api';

interface StrategyAttempt {
  strategy: FetchStrategyName | string;
  url: string;
  label?: string;
  sourceType?: SourceType;
}

interface FetchOutcome {
  html?: string;
  strategy?: string;
  attempt: number;
  status?: number;
  error?: string;
  finalUrl?: string;
  sourceType?: SourceType;
  proxyUsed?: boolean;
}

interface ScrapeAttemptMeta {
  projectId: string;
  sourceId: string;
  url: string;
  attempt: number;
  strategy: string;
  status?: number;
  error?: string;
}

const SOURCE_LIMIT: Record<Depth, number> = {
  quick: 2,
  standard: 4,
  deep: 6
};

const SCRAPER_TIMEOUT_MS = 15_000;
const MIRROR_TEMPLATES = ['https://r.jina.ai/{{raw}}'];
const MIN_RELEVANCE_TOKEN_LENGTH = 3;
const DEFAULT_RELEVANCE_SCORE = 0.4;

export async function runProjectPipeline({ projectId, requestId }: RunProjectPipelineArgs) {
  const { project, profile } = await loadProjectContext(projectId);
  const { title, query } = project;
  const depth = (project.depth ?? 'standard') as Depth;
  const llmOverrides = buildLlmOverrides(profile);

  await supabaseAdmin.from('projects').update({ status: 'running' }).eq('id', projectId);
  await ensureSourceTelemetryColumns();

  try {
    console.log(`[pipeline] ${projectId} planner start${requestId ? ` (req ${requestId})` : ''}`);
    const taskGraph = await buildTaskGraph(query, llmOverrides);
    await supabaseAdmin.from('projects').update({ task_graph: taskGraph as Json }).eq('id', projectId);
    console.log(`[pipeline] ${projectId} planner done`);
    const searchResults = await searchWeb(query, { limit: SOURCE_LIMIT[depth] });
    console.log(`[pipeline] ${projectId} search returned ${searchResults.length} results${requestId ? ` (req ${requestId})` : ''}`);

    const modelRegistry = await loadModelSourceRegistry();
    await refreshModelFeeds(modelRegistry);
    const priorityModels = matchModelSources(query, modelRegistry);
    const prioritySources = priorityModels.map((model) => ({
      title: `${model.vendor} — ${model.model_name}`,
      url: model.primary_url
    }));
    if (prioritySources.length) {
      console.log(`[pipeline] ${projectId} prioritized ${prioritySources.length} AI model source(s)`);
    }

    const seenResults = new Set<string>();
    const resultsQueue: SearchResult[] = [];
    const enqueueResult = (result: SearchResult) => {
      if (!result?.url) return;
      const key = normalizeUrl(result.url);
      if (seenResults.has(key)) return;
      seenResults.add(key);
      resultsQueue.push(result);
    };

    prioritySources.forEach(enqueueResult);
    searchResults.forEach(enqueueResult);

    const fallbackLookups = new Set<string>();
    const sourcesMeta: SourceMeta[] = [];
    const factsForReport: ReportFact[] = [];

    for (let idx = 0; idx < resultsQueue.length; idx++) {
      const result = resultsQueue[idx];
      const sourceId = await createSourcePlaceholder(projectId, result);
      console.log(`[pipeline] ${projectId} fetching ${result.url}`);

      const strategyQueue = buildStrategyQueue(result.url, modelRegistry);
      const scrapeOutcome = await fetchWithStrategies({
        projectId,
        sourceId,
        originalUrl: result.url,
        strategyQueue
      });

      if (!scrapeOutcome?.html) {
        console.warn(
          `[pipeline] ${projectId} scraper failed for ${result.url}: ${scrapeOutcome?.error ?? scrapeOutcome?.status ?? 'unknown'}`
        );
        const inferredSourceType = scrapeOutcome?.sourceType ?? mapStrategyToSourceType(scrapeOutcome?.strategy);
        await updateSourceRow(sourceId, {
          status: scrapeOutcome?.error ?? 'error',
          attempt_count: scrapeOutcome?.attempt ?? strategyQueue.length,
          fetch_strategy: scrapeOutcome?.strategy ?? 'direct',
          error_code: scrapeOutcome?.status ? String(scrapeOutcome.status) : null,
          last_error: scrapeOutcome?.error ?? null,
          proxy_used: scrapeOutcome?.proxyUsed ?? scrapeOutcome?.strategy === 'proxy',
          source_type: inferredSourceType
        });

        if (shouldTriggerHeadless(scrapeOutcome?.status)) {
          await scheduleHeadlessSnapshot({
            projectId,
            sourceId,
            url: result.url,
            reason: `status-${scrapeOutcome?.status ?? 'unknown'}`
          });
        }

        const fallbackQueries = getFallbackQueriesForUrl(result.url, modelRegistry);
        for (const fallbackQuery of fallbackQueries) {
          if (fallbackLookups.has(fallbackQuery)) continue;
          fallbackLookups.add(fallbackQuery);
          try {
            console.log(`[pipeline] ${projectId} running fallback search for "${fallbackQuery}"`);
            const fallbackResults = await searchWeb(fallbackQuery, { limit: 3 });
            fallbackResults.forEach(enqueueResult);
          } catch (fallbackError) {
            console.warn(`[pipeline] ${projectId} fallback search failed for ${fallbackQuery}`, fallbackError);
          }
        }
        continue;
      }

      const parsed = parseHtml(scrapeOutcome.html);
      const relevanceScore = scoreSourceRelevance(query, parsed.text);
      const sourceType = scrapeOutcome.sourceType ?? mapStrategyToSourceType(scrapeOutcome.strategy);

      await updateSourceRow(sourceId, {
        title: parsed.title || result.title,
        content: parsed.text,
        html: scrapeOutcome.html,
        status: 'fetched',
        fetch_strategy: scrapeOutcome.strategy ?? 'direct',
        attempt_count: scrapeOutcome.attempt,
        error_code: null,
        last_error: null,
        proxy_used: scrapeOutcome.proxyUsed ?? scrapeOutcome.strategy === 'proxy',
        source_type: sourceType,
        relevance_score: relevanceScore
      });

      const facts = heuristicFacts({ text: parsed.text, sourceId });
      const verifiedFacts = verifyFactsAgainstSource(facts, parsed.text);
      if (verifiedFacts.length) {
        await supabaseAdmin.from('facts').insert(
          verifiedFacts.map((fact) => ({
            project_id: projectId,
            source_id: fact.source_id,
            fact_type: fact.fact_type,
            content: fact.content,
            snippet: fact.snippet,
            confidence: fact.confidence,
            verified: fact.verified,
            verification_notes: fact.verification_notes,
            verified_at: fact.verified_at
          }))
        );
        factsForReport.push(...verifiedFacts.map((fact) => ({ sourceId: fact.source_id, content: fact.content })));
      }

      sourcesMeta.push({
        id: sourceId,
        title: parsed.title || result.title,
        url: scrapeOutcome.finalUrl ?? result.url,
        type: sourceType
      });
    }

    await ingestModelReleaseSnapshots({
      projectId,
      query,
      models: priorityModels,
      sourcesMeta,
      factsForReport
    });

    await ingestByokVendorData({
      profile,
      projectId,
      query,
      models: priorityModels,
      sourcesMeta,
      factsForReport
    });

    let markdown = buildReport({
      title,
      query,
      sources: sourcesMeta,
      facts: factsForReport,
      taskGraph
    });

    const assessment = await assessGoalCoverage({ query, reportMarkdown: markdown, overrides: llmOverrides });
    if (assessment) {
      markdown = appendVerifierSection(markdown, assessment);
    }

    await upsertReport(projectId, markdown, taskGraph);
    await supabaseAdmin
      .from('projects')
      .update({ status: 'done', verifier_summary: assessment?.summary ?? null })
      .eq('id', projectId);
    console.log(`[pipeline] ${projectId} completed`);
  } catch (error) {
    await supabaseAdmin.from('projects').update({ status: 'error' }).eq('id', projectId);
    console.error(`[pipeline] ${projectId} failed`, error);
    throw error;
  }
}

async function loadProjectContext(projectId: string): Promise<{ project: ProjectRow; profile: ProfileRow | null }> {
  const { data, error } = await supabaseAdmin.from('projects').select('*').eq('id', projectId).single();
  if (error || !data) {
    throw new Error(`Project ${projectId} not found: ${error?.message}`);
  }

  const projectRow = data as ProjectRow;
  let profile: ProfileRow | null = null;
  if (projectRow.profile_id) {
    const profileRes = await supabaseAdmin.from('profiles').select('*').eq('id', projectRow.profile_id).maybeSingle();
    profile = (profileRes.data as ProfileRow | null) ?? null;
  }

  return { project: projectRow, profile };
}

function buildLlmOverrides(profile: ProfileRow | null): ProviderOverrides | undefined {
  if (!profile) {
    return undefined;
  }

  const overrides: ProviderOverrides = {};
  const openai = profile.openai_api_key?.trim();
  if (openai) overrides.openai = openai;
  const anthropic = profile.anthropic_api_key?.trim();
  if (anthropic) overrides.anthropic = anthropic;
  const gemini = profile.gemini_api_key?.trim();
  if (gemini) overrides.gemini = gemini;

  return Object.keys(overrides).length ? overrides : undefined;
}

async function buildTaskGraph(query: string, overrides?: ProviderOverrides): Promise<TaskGraph> {
  try {
    const response = await generate({
      system: 'You are a focused research planner.',
      prompt: plannerPrompt(query),
      overrides
    });
    const jsonString = extractJson(response);
    return JSON.parse(jsonString) as TaskGraph;
  } catch {
    return {
      topics: ['Overview', 'Trends', 'Vendors'],
      keywords: [query],
      must_cover: [],
      domains_hint: [],
      stop: { max_pages: 6, coverage_pct: 0.7 }
    } as TaskGraph;
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Planner response did not contain JSON.');
  }
  return text.slice(start, end + 1);
}

async function fetchWithStrategies({
  projectId,
  sourceId,
  originalUrl,
  strategyQueue
}: {
  projectId: string;
  sourceId: string;
  originalUrl: string;
  strategyQueue: StrategyAttempt[];
}): Promise<FetchOutcome> {
  const queue = strategyQueue.length
    ? strategyQueue
    : [{ strategy: 'direct', url: originalUrl, sourceType: 'scraped' as SourceType }];
  let attempt = 0;
  let lastError: string | undefined;
  let lastStatus: number | undefined;
  let lastStrategy: string | undefined;
  let lastSourceType: SourceType | undefined;

  for (const step of queue) {
    attempt += 1;
    lastStrategy = step.strategy;
    lastSourceType = step.sourceType ?? mapStrategyToSourceType(step.strategy);
    const scrape = await invokeScraper({ url: step.url, timeoutMs: SCRAPER_TIMEOUT_MS, strategy: step.strategy as FetchStrategyName });
    await logScrapeEvent({
      projectId,
      sourceId,
      url: step.url,
      attempt,
      strategy: step.strategy,
      status: scrape.status,
      error: scrape.error
    });

    if (scrape.ok && scrape.html) {
      return {
        html: scrape.html,
        strategy: step.strategy,
        attempt,
        status: scrape.status,
        finalUrl: step.url,
        sourceType: step.sourceType ?? mapStrategyToSourceType(step.strategy),
        proxyUsed: step.strategy === 'proxy'
      };
    }

    lastError = scrape.error;
    lastStatus = scrape.status;
  }

  return {
    attempt,
    strategy: lastStrategy,
    status: lastStatus,
    error: lastError,
    sourceType: lastSourceType,
    proxyUsed: lastStrategy === 'proxy'
  };
}

async function ingestModelReleaseSnapshots({
  projectId,
  query,
  models,
  sourcesMeta,
  factsForReport
}: {
  projectId: string;
  query: string;
  models: ModelSourceRecord[];
  sourcesMeta: SourceMeta[];
  factsForReport: ReportFact[];
}) {
  if (!models.length) return;

  const modelIds = models.map((model) => model.id).filter(isValidModelId);
  if (!modelIds.length) return;

  const { data: releases, error } = await supabaseAdmin
    .from('model_releases')
    .select('*')
    .in('model_source_id', modelIds)
    .order('release_date', { ascending: false })
    .limit(6);

  if (error) {
    console.warn('[pipeline] failed to load model releases', error);
    return;
  }

  const releaseRows = (releases ?? []) as ModelReleaseRow[];
  if (!releaseRows.length) return;

  for (const release of releaseRows) {
    const model = models.find((entry) => entry.id === release.model_source_id);
    if (!model) continue;
    const summary = coerceReleaseSummary(release);
    if (!summary) continue;

    const releaseUrl = buildReleaseVirtualUrl(model.primary_url, release);
    const title = buildReleaseTitle(model, release);
    const relevanceScore = scoreSourceRelevance(query, summary);
    const releaseInsert = await insertSourceRow({
      project_id: projectId,
      url: releaseUrl,
      domain: safeDomain(model.primary_url),
      title,
      status: 'fetched',
      content: summary,
      html: null,
      fetch_strategy: 'api',
      attempt_count: 0,
      error_code: null,
      last_error: null,
      proxy_used: false,
      source_type: 'api',
      relevance_score: relevanceScore
    });

    if (releaseInsert.error || !releaseInsert.data) {
      console.warn('[pipeline] failed to insert release snapshot', releaseInsert.error?.message);
      continue;
    }

    const sourceId = releaseInsert.data.id;
    sourcesMeta.push({ id: sourceId, title, url: releaseUrl, type: 'api' });

    const facts = verifyFactsAgainstSource(heuristicFacts({ text: summary, sourceId }), summary);
    if (facts.length) {
      await supabaseAdmin.from('facts').insert(
        facts.map((fact) => ({
          project_id: projectId,
          source_id: fact.source_id,
          fact_type: fact.fact_type,
          content: fact.content,
          snippet: fact.snippet,
          confidence: fact.confidence,
          verified: fact.verified,
          verification_notes: fact.verification_notes,
          verified_at: fact.verified_at
        }))
      );
      factsForReport.push(...facts.map((fact) => ({ sourceId: fact.source_id, content: fact.content })));
    }
  }
}

async function ingestByokVendorData({
  profile,
  projectId,
  query,
  models,
  sourcesMeta,
  factsForReport
}: {
  profile: ProfileRow | null;
  projectId: string;
  query: string;
  models: ModelSourceRecord[];
  sourcesMeta: SourceMeta[];
  factsForReport: ReportFact[];
}) {
  if (!profile) return;
  const tasks: Promise<void>[] = [];

  if (profile.openai_api_key) {
    tasks.push(
      ingestOpenAiByok({
        apiKey: profile.openai_api_key,
        projectId,
        query,
        models,
        sourcesMeta,
        factsForReport
      })
    );
  }

  await Promise.all(tasks);
}

interface OpenAiModel {
  id: string;
  created?: number;
  owned_by?: string;
}

async function ingestOpenAiByok({
  apiKey,
  projectId,
  query,
  models,
  sourcesMeta,
  factsForReport
}: {
  apiKey: string;
  projectId: string;
  query: string;
  models: ModelSourceRecord[];
  sourcesMeta: SourceMeta[];
  factsForReport: ReportFact[];
}) {
  const openAiTargets = models.filter((model) => model.vendor.toLowerCase() === 'openai');
  if (!openAiTargets.length || !apiKey) {
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.warn('[pipeline] OpenAI BYOK request failed', response.status);
      return;
    }

    const payload = (await response.json()) as { data?: OpenAiModel[] };
    const data = Array.isArray(payload.data) ? payload.data : [];

    for (const target of openAiTargets) {
      const match = data.find((entry) => entry?.id && modelMatchesTarget(entry.id, target));
      if (!match) continue;

      const releaseUrl = `${target.primary_url}#openai-api-${match.id}`;
      const existing = await supabaseAdmin
        .from('sources')
        .select('id')
        .eq('project_id', projectId)
        .eq('url', releaseUrl)
        .maybeSingle();
      if (existing.data) {
        continue;
      }

      const title = `${target.vendor} — ${target.model_name} (via API)`;
      const summary = buildOpenAiSummary(match, target);
      const relevanceScore = scoreSourceRelevance(query, summary);

      const byokInsert = await insertSourceRow({
        project_id: projectId,
        url: releaseUrl,
        domain: safeDomain(target.primary_url),
        title,
        status: 'fetched',
        content: summary,
        html: null,
        fetch_strategy: 'api',
        attempt_count: 0,
        error_code: null,
        last_error: null,
        proxy_used: false,
        source_type: 'api',
        relevance_score: relevanceScore
      });

      if (byokInsert.error || !byokInsert.data) {
        console.warn('[pipeline] failed to insert OpenAI BYOK source', byokInsert.error?.message);
        continue;
      }

      const sourceId = byokInsert.data.id;
      sourcesMeta.push({ id: sourceId, title, url: releaseUrl, type: 'api' });

      const facts = verifyFactsAgainstSource(heuristicFacts({ text: summary, sourceId }), summary);
      if (facts.length) {
        await supabaseAdmin.from('facts').insert(
          facts.map((fact) => ({
            project_id: projectId,
            source_id: fact.source_id,
            fact_type: fact.fact_type,
            content: fact.content,
            snippet: fact.snippet,
            confidence: fact.confidence,
            verified: fact.verified,
            verification_notes: fact.verification_notes,
            verified_at: fact.verified_at
          }))
        );
        factsForReport.push(...facts.map((fact) => ({ sourceId: fact.source_id, content: fact.content })));
      }
    }
  } catch (error) {
    console.warn('[pipeline] failed to ingest OpenAI BYOK data', error);
  }
}

function coerceReleaseSummary(release: ModelReleaseRow) {
  if (release.summary) return release.summary;
  if (release.payload && typeof release.payload === 'object') {
    const payload = release.payload as Record<string, unknown>;
    if (typeof payload.summary === 'string') {
      return payload.summary;
    }
    if (typeof payload.description === 'string') {
      return payload.description;
    }
  }
  return null;
}

function buildReleaseVirtualUrl(primaryUrl: string, release: ModelReleaseRow) {
  const suffix = release.id ?? `${Date.now()}`;
  return `${primaryUrl}#release-${suffix}`;
}

function buildReleaseTitle(model: ModelSourceRecord, release: ModelReleaseRow) {
  const version = release.version ? ` ${release.version}` : '';
  return `${model.vendor} ${model.model_name}${version}`.trim();
}

function appendVerifierSection(markdown: string, assessment: GoalAssessment) {
  const lines = markdown.split('\n');
  lines.push('');
  lines.push('## Verifier Summary');
  lines.push(`Alignment: **${assessment.alignment}** (confidence ${(assessment.confidence * 100).toFixed(0)}%)`);
  if (assessment.summary) {
    lines.push(assessment.summary);
  }
  if (assessment.missing_topics?.length) {
    lines.push('');
    lines.push('Potential gaps:');
    assessment.missing_topics.forEach((topic) => lines.push(`- ${topic}`));
  }
  return lines.join('\n');
}

function buildOpenAiSummary(model: OpenAiModel, target: ModelSourceRecord) {
  const owner = model.owned_by ?? 'OpenAI';
  const createdAt = model.created ? new Date(model.created * 1000).toISOString() : null;
  const parts = [
    `${target.model_name} (${model.id}) is listed by ${owner}.`,
    createdAt ? `Last updated ${createdAt}.` : null
  ].filter(Boolean);
  return parts.join(' ');
}

function modelMatchesTarget(modelId: string, target: ModelSourceRecord) {
  const normalized = normalizeModelSlug(modelId);
  if (!normalized) return false;
  const tokens = [
    normalizeModelSlug(target.model_name),
    ...normalizeKeywords(target.keywords).map((keyword) => normalizeModelSlug(keyword))
  ].filter(Boolean) as string[];

  return tokens.some((token) => normalized.includes(token));
}

function normalizeModelSlug(value?: string | null) {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function logScrapeEvent(meta: ScrapeAttemptMeta) {
  try {
    await supabaseAdmin.from('scrape_events').insert({
      project_id: meta.projectId,
      source_id: meta.sourceId,
      url: meta.url,
      attempt: meta.attempt,
      strategy: meta.strategy,
      status: meta.status ? String(meta.status) : null,
      error: meta.error ?? null
    });
  } catch (error) {
    console.warn('[pipeline] failed to log scrape event', error);
  }
}

function buildStrategyQueue(originalUrl: string, registry: ModelSourceRecord[]) {
  const queue: StrategyAttempt[] = [];
  const seen = new Set<string>();

  const pushAttempt = (attempt: StrategyAttempt) => {
    const key = normalizeUrl(attempt.url);
    if (seen.has(key)) return;
    seen.add(key);
    queue.push(attempt);
  };

  pushAttempt({ strategy: 'direct', url: originalUrl, sourceType: 'scraped' });

  const matchedModel = findModelByUrl(originalUrl, registry);
  if (matchedModel) {
    if (matchedModel.needs_proxy) {
      pushAttempt({ strategy: 'proxy', url: originalUrl, sourceType: 'proxy' });
    }

    const altLinks = [matchedModel.docs_url, ...(matchedModel.press_pdfs ?? [])].filter(
      (entry): entry is string => Boolean(entry)
    );
    altLinks.forEach((altUrl) => pushAttempt({ strategy: 'alt', url: altUrl, sourceType: 'scraped' }));

    const mirrorCandidates = expandMirrorsForModel(originalUrl, matchedModel);
    mirrorCandidates.forEach((mirrorUrl) => pushAttempt({ strategy: 'mirror', url: mirrorUrl, sourceType: 'mirror' }));
  }

  MIRROR_TEMPLATES.map((template) => applyMirrorTemplate(template, originalUrl)).forEach((mirrorUrl) =>
    pushAttempt({ strategy: 'mirror', url: mirrorUrl, sourceType: 'mirror' })
  );

  return queue;
}

function applyMirrorTemplate(template: string, url: string) {
  return template.replace('{{raw}}', url).replace('{{encoded}}', encodeURIComponent(url));
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '';
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getFallbackQueriesForUrl(url: string, registry: ModelSourceRecord[]) {
  const model = findModelByUrl(url, registry);
  if (!model) return [];
  return getFallbackQueriesForModel(model);
}

function scoreSourceRelevance(query: string, text: string) {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return DEFAULT_RELEVANCE_SCORE;

  const normalized = (text ?? '').toLowerCase();
  if (!normalized) return DEFAULT_RELEVANCE_SCORE;

  const matches = tokens.reduce((count, token) => count + (normalized.includes(token) ? 1 : 0), 0);
  return Number((matches / tokens.length).toFixed(2));
}

function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > MIN_RELEVANCE_TOKEN_LENGTH);
}


function normalizeKeywords(list?: string[] | null) {
  return (list ?? []).filter((entry): entry is string => Boolean(entry));
}

function shouldTriggerHeadless(status?: number) {
  if (!status) return false;
  return [403, 429, 503].includes(status);
}

function mapStrategyToSourceType(strategy?: string): SourceType {
  if (strategy === 'mirror') return 'mirror';
  if (strategy === 'proxy') return 'proxy';
  return 'scraped';
}

async function createSourcePlaceholder(projectId: string, result: SearchResult) {
  const insertResult = await insertSourceRow({
    project_id: projectId,
    url: result.url,
    domain: safeDomain(result.url),
    title: result.title,
    status: 'fetching',
    source_type: 'scraped'
  });

  if (insertResult.error || !insertResult.data) {
    throw new Error(`Failed to insert source: ${insertResult.error?.message}`);
  }

  return insertResult.data.id;
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function upsertReport(projectId: string, markdown: string, taskGraph: TaskGraph) {
  const existing = await supabaseAdmin.from('reports').select('id').eq('project_id', projectId).maybeSingle();

  if (existing.data) {
    await supabaseAdmin.from('reports').update({ markdown, json_outline: taskGraph as Json }).eq('id', existing.data.id);
  } else {
    await supabaseAdmin.from('reports').insert({
      project_id: projectId,
      markdown,
      json_outline: taskGraph as Json
    });
  }
}

const SOURCE_TELEMETRY_COLUMNS = ['attempt_count', 'fetch_strategy', 'error_code', 'last_error', 'proxy_used', 'source_type'];
let sourceTelemetrySupported: boolean | null = null;
let telemetryCheckInFlight: Promise<boolean> | null = null;

function stripTelemetryColumns<T extends Record<string, unknown>>(payload: T): T {
  const clone: Record<string, unknown> = { ...payload };
  for (const column of SOURCE_TELEMETRY_COLUMNS) {
    if (column in clone) {
      delete clone[column];
    }
  }
  return clone as T;
}

function isTelemetryColumnError(error?: PostgrestError | null) {
  if (!error?.message) return false;
  const lower = error.message.toLowerCase();
  if (lower.includes('schema cache')) return true;
  return SOURCE_TELEMETRY_COLUMNS.some((column) => lower.includes(column));
}

function logTelemetryDisable(message: string) {
  if (sourceTelemetrySupported !== false) {
    console.warn('[pipeline] telemetry columns unavailable on sources table, continuing without instrumentation:', message);
  }
  sourceTelemetrySupported = false;
}

async function insertSourceRow(payload: SourceInsertPayload) {
  if (sourceTelemetrySupported === null) {
    await ensureSourceTelemetryColumns();
  }
  if (sourceTelemetrySupported === false) {
    return supabaseAdmin.from('sources').insert(stripTelemetryColumns(payload)).select('id').single();
  }

  const result = await supabaseAdmin.from('sources').insert(payload).select('id').single();
  if (result.error && isTelemetryColumnError(result.error)) {
    logTelemetryDisable(result.error.message);
    return supabaseAdmin.from('sources').insert(stripTelemetryColumns(payload)).select('id').single();
  }

  if (!result.error) {
    sourceTelemetrySupported = true;
  }
  return result;
}

async function updateSourceRow(sourceId: string, payload: SourceUpdatePayload) {
  if (sourceTelemetrySupported === null) {
    await ensureSourceTelemetryColumns();
  }
  if (sourceTelemetrySupported === false) {
    return supabaseAdmin.from('sources').update(stripTelemetryColumns(payload)).eq('id', sourceId);
  }

  const result = await supabaseAdmin.from('sources').update(payload).eq('id', sourceId);
  if (result.error && isTelemetryColumnError(result.error)) {
    logTelemetryDisable(result.error.message);
    return supabaseAdmin.from('sources').update(stripTelemetryColumns(payload)).eq('id', sourceId);
  }

  if (!result.error) {
    sourceTelemetrySupported = true;
  }
  return result;
}

async function ensureSourceTelemetryColumns() {
  if (sourceTelemetrySupported !== null) {
    return sourceTelemetrySupported;
  }

  if (telemetryCheckInFlight) {
    return telemetryCheckInFlight;
  }

  telemetryCheckInFlight = (async () => {
    try {
      const { error } = await supabaseAdmin.from('sources').select('attempt_count').limit(1);
      if (error && isTelemetryColumnError(error)) {
        logTelemetryDisable(error.message);
        return false;
      }
      if (error) {
        console.warn('[pipeline] unable to verify sources telemetry columns', error.message);
        return true;
      }
      sourceTelemetrySupported = true;
      return true;
    } catch (error) {
      logTelemetryDisable(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      telemetryCheckInFlight = null;
    }
  })();

  sourceTelemetrySupported = await telemetryCheckInFlight;
  return sourceTelemetrySupported;
}

function buildReport({
  title,
  query,
  sources,
  facts,
  taskGraph
}: {
  title: string;
  query: string;
  sources: SourceMeta[];
  facts: ReportFact[];
  taskGraph: TaskGraph;
}) {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`Research goal: **${query}**`);
  lines.push('');
  lines.push('## TL;DR');
  if (facts.length) {
    lines.push(`Intellex scanned ${sources.length} source(s) and surfaced the strongest signals below.`);
  } else {
    lines.push('Planner is ready, waiting on Extractor/Synth to capture facts from fetched sources.');
  }
  lines.push('');
  lines.push('## Key Findings');

  if (facts.length) {
    facts.slice(0, 5).forEach((fact) => {
      const sourceIndex = sources.findIndex((source) => source.id === fact.sourceId);
      const citation = sourceIndex >= 0 ? `[${sourceIndex + 1}]` : '';
      lines.push(`- ${fact.content} ${citation}`.trim());
    });
  } else {
    lines.push('- No structured facts yet. Re-run once sources are parsed.');
  }

  lines.push('');
  lines.push('## Planner Coverage');
  const topics = (taskGraph.topics ?? []) as string[];
  if (topics.length) {
    lines.push(`Topics queued: ${topics.join(', ')}`);
  } else {
    lines.push('Planner returned a lightweight graph placeholder.');
  }

  lines.push('');
  lines.push('## Sources');
  if (sources.length) {
    sources.forEach((source, idx) => {
      lines.push(`[${idx + 1}] ${source.title || source.url} — ${source.url}`);
    });
  } else {
    lines.push('No sources fetched yet.');
  }

  return lines.join('\n');
}
