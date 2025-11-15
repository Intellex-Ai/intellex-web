import { JSDOM } from 'jsdom';
import type { SearchOptions, SearchResult } from './types';

const USER_AGENT = 'IntellexResearchBot/1.0 (+https://intellex.ai)';
const SEARCH_ENDPOINT = 'https://html.duckduckgo.com/html/';

export async function freeSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const limit = options.limit ?? 5;
  const params = new URLSearchParams({
    q: query,
    kl: options.locale ?? 'us-en'
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    headers: { 'user-agent': USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed (${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html);
  const anchors = dom.window.document.querySelectorAll<HTMLAnchorElement>('a.result__a');

  const results: SearchResult[] = [];

  anchors.forEach((anchor) => {
    if (results.length >= limit) return;
    const href = anchor.getAttribute('href') ?? '';
    const url = extractRedirectUrl(href);
    if (!url) return;
    results.push({
      title: anchor.textContent?.trim() ?? url,
      url
    });
  });

  return results;
}

function extractRedirectUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname.endsWith('duckduckgo.com') && parsed.pathname.startsWith('/l/')) {
      const target = parsed.searchParams.get('uddg');
      return target ? decodeURIComponent(target) : null;
    }
    return rawUrl;
  } catch {
    return null;
  }
}
