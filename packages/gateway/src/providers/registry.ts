import type { ProviderAdapter } from './types';
import { azureAi } from './azure-ai';
import { openai } from './openai';
import { openaiCompatible } from './openai-compatible';

const registry: Record<string, ProviderAdapter> = {
  openai,
  'azure-ai': azureAi,
  // OpenAI-compatible providers
  groq: openaiCompatible('Groq', 'https://api.groq.com/openai/v1'),
  together: openaiCompatible('Together', 'https://api.together.xyz/v1'),
  deepseek: openaiCompatible('DeepSeek', 'https://api.deepseek.com/v1'),
  fireworks: openaiCompatible(
    'Fireworks',
    'https://api.fireworks.ai/inference/v1'
  ),
  perplexity: openaiCompatible('Perplexity', 'https://api.perplexity.ai'),
  anyscale: openaiCompatible(
    'Anyscale',
    'https://api.endpoints.anyscale.com/v1'
  ),
  mistral: openaiCompatible('Mistral', 'https://api.mistral.ai/v1'),
  openrouter: openaiCompatible('OpenRouter', 'https://openrouter.ai/api/v1'),
  novita: openaiCompatible('Novita', 'https://api.novita.ai/v3/openai'),
  cerebras: openaiCompatible('Cerebras', 'https://api.cerebras.ai/v1'),
  sambanova: openaiCompatible('SambaNova', 'https://api.sambanova.ai/v1'),
};

/** Look up a provider adapter by name. Returns undefined if not registered. */
export function getProvider(name: string): ProviderAdapter | undefined {
  return registry[name];
}
