import { createHash } from 'node:crypto';

export type LlmProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'together' | 'openrouter';
export type ProviderOverrides = Partial<Record<LlmProvider, string>>;

interface GenerateArgs {
  system: string;
  prompt: string;
  temperature?: number;
  overrides?: ProviderOverrides;
}

interface CacheEntry {
  value: string;
  expiresAt: number;
}

type ProviderEnvVar =
  | 'OPENAI_API_KEY'
  | 'ANTHROPIC_API_KEY'
  | 'GEMINI_API_KEY'
  | 'GROQ_API_KEY'
  | 'TOGETHER_API_KEY'
  | 'OPENROUTER_API_KEY';

interface HostedProvider {
  name: LlmProvider;
  label: string;
  envVar: ProviderEnvVar;
  call: (args: NormalizedArgs, apiKey: string) => Promise<string>;
}

interface NormalizedArgs {
  system: string;
  prompt: string;
  temperature: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

const promptCache = new Map<string, CacheEntry>();
const providerCooldowns = new Map<LlmProvider, number>();

const HOSTED_PROVIDERS: HostedProvider[] = [
  {
    name: 'openai',
    label: 'OpenAI GPT-4o mini',
    envVar: 'OPENAI_API_KEY',
    call: (args, apiKey) =>
      callOpenAiCompatible({
        apiKey,
        model: 'gpt-4o-mini',
        url: 'https://api.openai.com/v1/chat/completions',
        ...args
      })
  },
  {
    name: 'anthropic',
    label: 'Anthropic Claude 3 Haiku',
    envVar: 'ANTHROPIC_API_KEY',
    call: callAnthropic
  },
  {
    name: 'gemini',
    label: 'Google Gemini 1.5 Flash',
    envVar: 'GEMINI_API_KEY',
    call: callGemini
  },
  {
    name: 'groq',
    label: 'Groq Llama 3.1 70B',
    envVar: 'GROQ_API_KEY',
    call: (args, apiKey) =>
      callOpenAiCompatible({
        apiKey,
        model: 'llama-3.1-70b-versatile',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        ...args
      })
  },
  {
    name: 'together',
    label: 'Together Mixtral/Llama mesh',
    envVar: 'TOGETHER_API_KEY',
    call: (args, apiKey) =>
      callOpenAiCompatible({
        apiKey,
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        url: 'https://api.together.xyz/v1/chat/completions',
        ...args
      })
  },
  {
    name: 'openrouter',
    label: 'OpenRouter auto mesh',
    envVar: 'OPENROUTER_API_KEY',
    call: (args, apiKey) =>
      callOpenAiCompatible({
        apiKey,
        model: 'openrouter/auto',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        extraHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://intellex.ai',
          'X-Title': 'Intellex'
        },
        ...args
      })
  }
];

export async function generate({ system, prompt, temperature = 0.2, overrides }: GenerateArgs) {
  const normalized: NormalizedArgs = { system, prompt, temperature };
  const cacheKey = buildCacheKey(normalized);
  const cached = promptCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const providers = getAvailableProviders(overrides);
  if (!providers.length) {
    throw new Error(
      'Hosted LLM unavailable. Set at least one API key: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, TOGETHER_API_KEY, or OPENROUTER_API_KEY.'
    );
  }

  const errors: string[] = [];
  for (const provider of providers) {
    const apiKey = readKey(provider, overrides);
    if (!apiKey) continue;
    try {
      const response = await provider.call(normalized, apiKey);
      promptCache.set(cacheKey, { value: response, expiresAt: Date.now() + CACHE_TTL_MS });
      providerCooldowns.delete(provider.name);
      return response;
    } catch (error) {
      providerCooldowns.set(provider.name, Date.now() + COOLDOWN_MS);
      errors.push(`${provider.label}: ${(error as Error).message}`);
    }
  }

  throw new Error(`All hosted LLM providers failed. ${errors.join(' | ')}`);
}

function getAvailableProviders(overrides?: ProviderOverrides) {
  const keyed = HOSTED_PROVIDERS.filter((provider) => Boolean(readKey(provider, overrides)));
  if (!keyed.length) {
    return [];
  }

  const ready = keyed.filter((provider) => !isCoolingDown(provider.name));
  return ready.length ? ready : keyed;
}

function readKey(provider: HostedProvider, overrides?: ProviderOverrides) {
  const overrideKey = overrides?.[provider.name];
  if (overrideKey && overrideKey.trim().length) {
    return overrideKey.trim();
  }
  const envValue = process.env[provider.envVar];
  return typeof envValue === 'string' && envValue.trim().length ? envValue.trim() : null;
}

function isCoolingDown(provider: LlmProvider) {
  const until = providerCooldowns.get(provider);
  return Boolean(until && until > Date.now());
}

function buildCacheKey({ system, prompt, temperature }: NormalizedArgs) {
  return createHash('sha256').update(system).update(prompt).update(String(temperature)).digest('hex');
}

async function callOpenAiCompatible({
  apiKey,
  url,
  model,
  system,
  prompt,
  temperature,
  extraHeaders = {}
}: {
  apiKey: string;
  url: string;
  model: string;
  system: string;
  prompt: string;
  temperature: number;
  extraHeaders?: Record<string, string>;
}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || 'no body'}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (!entry) return '';
        if (typeof entry === 'string') return entry;
        if (typeof entry?.text === 'string') return entry.text;
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

async function callAnthropic({ system, prompt, temperature }: NormalizedArgs, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      temperature,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${text || 'no body'}`);
  }

  const json = await response.json();
  const content = Array.isArray(json.content)
    ? json.content
        .map((part: { text?: string }) => part?.text ?? '')
        .filter(Boolean)
        .join('\n')
        .trim()
    : '';
  return content;
}

async function callGemini({ system, prompt, temperature }: NormalizedArgs, apiKey: string) {
  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 1024
    }
  };

  if (system) {
    body.systemInstruction = {
      role: 'system',
      parts: [{ text: system }]
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message ?? JSON.stringify(json);
    throw new Error(`Gemini request failed (${response.status}): ${message}`);
  }

  const candidate = json.candidates?.[0];
  const content = candidate?.content?.parts
    ?.map((part: { text?: string }) => part?.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();
  return content ?? '';
}
