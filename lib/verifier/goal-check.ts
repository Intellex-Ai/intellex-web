import { generate, type ProviderOverrides } from '@/lib/llm';

export interface GoalAssessment {
  alignment: 'strong' | 'partial' | 'weak';
  confidence: number;
  summary: string;
  missing_topics: string[];
}

interface AssessGoalCoverageArgs {
  query: string;
  reportMarkdown: string;
  overrides?: ProviderOverrides;
}

export async function assessGoalCoverage({
  query,
  reportMarkdown,
  overrides
}: AssessGoalCoverageArgs): Promise<GoalAssessment | null> {
  try {
    const prompt = [
      `Research goal: """${query}"""`,
      'Report:',
      reportMarkdown,
      '',
      'Return a short JSON object describing whether the report fully answers the goal.',
      'Format: {"alignment":"strong|partial|weak","confidence":0-1,"summary":"...","missing_topics":["..."]}'
    ].join('\n');

    const response = await generate({
      system: 'You audit research quality. Be blunt, return only JSON.',
      prompt,
      overrides
    });

    const json = extractJson(response);
    return json ?? null;
  } catch (error) {
    console.warn('[verifier] failed to assess goal coverage', error);
    return heuristicAssessment(query, reportMarkdown);
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as GoalAssessment;
    parsed.missing_topics = Array.isArray(parsed.missing_topics) ? parsed.missing_topics.filter((entry) => !!entry) : [];
    parsed.alignment = normalizeAlignment(parsed.alignment);
    parsed.confidence = clamp(parsed.confidence ?? 0.5, 0, 1);
    parsed.summary = parsed.summary ?? '';
    return parsed;
  } catch {
    return null;
  }
}

function normalizeAlignment(value?: string): GoalAssessment['alignment'] {
  const normalized = (value || '').toLowerCase();
  if (normalized.startsWith('strong')) return 'strong';
  if (normalized.startsWith('weak')) return 'weak';
  return 'partial';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function heuristicAssessment(query: string, reportMarkdown: string): GoalAssessment {
  const tokens = tokenize(query);
  const normalizedReport = reportMarkdown.toLowerCase();
  const matches = tokens.filter((token) => normalizedReport.includes(token));
  const ratio = tokens.length ? matches.length / tokens.length : 0;

  let alignment: GoalAssessment['alignment'] = 'partial';
  if (ratio >= 0.7) {
    alignment = 'strong';
  } else if (ratio <= 0.3) {
    alignment = 'weak';
  }

  const missingTopics = tokens.filter((token) => !normalizedReport.includes(token)).slice(0, 5);

  return {
    alignment,
    confidence: clamp(0.3 + ratio * 0.4, 0.3, 0.9),
    summary: `Heuristic fallback (hosted LLM mesh unavailable): ${matches.length}/${tokens.length || 1} goal keywords appear in the report.`,
    missing_topics: missingTopics
  };
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 3);
}
