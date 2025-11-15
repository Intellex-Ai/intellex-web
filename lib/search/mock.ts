import type { SearchOptions, SearchResult } from './types';

const FALLBACK_RESULTS: SearchResult[] = [
  {
    title: 'OpenAI — Introducing GPT-4o mini',
    url: 'https://openai.com/index/gpt-4o-mini/'
  },
  {
    title: 'Anthropic — Claude 3 model family',
    url: 'https://www.anthropic.com/news/claude-3-family'
  },
  {
    title: 'Google — Responsible AI practices',
    url: 'https://ai.google/responsibility/principles/'
  },
  {
    title: 'McKinsey — The state of AI 2024',
    url: 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-state-of-ai-in-2024'
  },
  {
    title: 'MIT Technology Review — AI policy update',
    url: 'https://www.technologyreview.com/topic/ai/'
  }
];

export async function mockSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const limit = options.limit ?? 5;
  return FALLBACK_RESULTS.slice(0, limit).map((result) => ({
    ...result,
    snippet: `Seeded result for "${query}" (mock provider).`
  }));
}
