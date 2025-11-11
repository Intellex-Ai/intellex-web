export type LlmProvider = 'ollama' | 'openai' | 'anthropic' | 'together';

interface GenerateArgs {
  system: string;
  prompt: string;
  temperature?: number;
}

export async function generate({ system, prompt, temperature = 0.2 }: GenerateArgs) {
  const provider = (process.env.LLM_PROVIDER as LlmProvider) || 'ollama';

  switch (provider) {
    case 'openai':
      return callOpenAI({ system, prompt, temperature });
    case 'anthropic':
    case 'together':
    case 'ollama':
    default:
      return callOllama({ system, prompt, temperature });
  }
}

async function callOllama({ system, prompt }: GenerateArgs) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3:instruct',
      system,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const data = (await response.json()) as { response: string };
  return data.response.trim();
}

async function callOpenAI({ system, prompt, temperature }: GenerateArgs) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing, set LLM_PROVIDER=ollama or provide a key.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content?.trim() ?? '';
}
