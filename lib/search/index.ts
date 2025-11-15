import { getServerEnv } from '@/lib/env';
import type { SearchOptions, SearchResult } from './types';
import { freeSearch } from './free';
import { mockSearch } from './mock';

type Provider = 'free' | 'mock' | 'bing' | 'brave';

const { SEARCH_PROVIDER } = getServerEnv();

export async function searchWeb(query: string, options?: SearchOptions): Promise<SearchResult[]> {
  const provider = (SEARCH_PROVIDER as Provider | undefined) ?? 'free';

  switch (provider) {
    case 'free':
      return freeSearch(query, options);
    case 'mock':
      return mockSearch(query, options);
    default:
      throw new Error(`Search provider "${provider}" is not configured yet.`);
  }
}

export type { SearchResult, SearchOptions } from './types';
