export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface SearchOptions {
  limit?: number;
  locale?: string;
}
