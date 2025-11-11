interface FetchArgs {
  url: string;
  timeoutMs?: number;
}

interface FetchResult {
  ok: boolean;
  status: number;
  html?: string;
  error?: string;
}

export async function invokeScraper({ url, timeoutMs = 20_000 }: FetchArgs): Promise<FetchResult> {
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
      body: JSON.stringify({ url }),
      signal: controller.signal
    });

    if (!response.ok) {
      return { ok: false, status: response.status, error: await response.text() };
    }

    const json = (await response.json()) as FetchResult;
    return json;
  } finally {
    clearTimeout(timeout);
  }
}
