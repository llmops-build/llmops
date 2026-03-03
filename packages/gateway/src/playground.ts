/**
 * Playground script — makes a real streaming chat completion call through the gateway.
 *
 * Usage:
 *   API_KEY=sk-or-... npx tsx src/playground.ts
 *
 * Env vars:
 *   API_KEY    — required (falls back to OPENAI_API_KEY)
 *   PROVIDER   — provider name (default: "openrouter")
 *   MODEL      — model to use  (default: "openai/gpt-4o-mini")
 *   PROMPT     — user message  (default: "Tell me a short joke")
 */

import { proxyRequest } from './proxy';
import type { ProviderConfig } from './types/provider';

const apiKey = process.env.API_KEY ?? process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: API_KEY env var is required');
  process.exit(1);
}

const provider = process.env.PROVIDER ?? 'openrouter';
const model = process.env.MODEL ?? 'openai/gpt-4o-mini';
const prompt = process.env.PROMPT ?? 'Give me a famous poem';

const config: ProviderConfig = { provider, apiKey };

const request = new Request('http://localhost/v1/chat/completions', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  }),
});

console.log(`Provider: ${provider}`);
console.log(`Model:    ${model}`);
console.log(`Prompt:   "${prompt}"`);
console.log('---');

const response = await proxyRequest(config, request);

if (!response.ok) {
  console.error(`Upstream error ${response.status}:`);
  console.error(await response.text());
  process.exit(1);
}

const reader = response.body!.getReader();
const decoder = new TextDecoder();

let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') {
      process.stdout.write('\n');
      continue;
    }
    try {
      const parsed = JSON.parse(data);
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) process.stdout.write(token);
    } catch {
      // skip malformed chunks
    }
  }
}

console.log('\n--- done ---');
