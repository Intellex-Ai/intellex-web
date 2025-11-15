type ScraperStrategy = 'direct' | 'proxy' | 'mirror' | 'alt';

interface FetchArgs {
  url: string;
  timeoutMs?: number;
  strategy?: ScraperStrategy;
}

interface FetchResult {
  ok: boolean;
  status: number;
  html?: string;
  error?: string;
}

export async function invokeScraper({ url, timeoutMs = 20_000, strategy = 'direct' }: FetchArgs): Promise<FetchResult> {
  const invokeUrl = process.env.SCRAPER_INVOKE_URL;
  const token = process.env.SCRAPER_TOKEN;

  if (!invokeUrl || !token) {
    throw new Error('SCRAPER_INVOKE_URL or SCRAPER_TOKEN missing.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url, strategy }),
      signal: controller.signal
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: await response.text() };
    }

    const json = (await response.json()) as FetchResult;
    return json;
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const message = isAbortError
      ? `Scraper request timed out after ${timeoutMs}ms`
      : error instanceof Error
        ? error.message
        : 'Unknown scraper error';
    return { ok: false, status: isAbortError ? 408 : 0, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
