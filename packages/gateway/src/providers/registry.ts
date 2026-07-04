import { openaiCompatible } from './openai-compatible';
import type { ProviderAdapter } from './types';

/**
 * Default base URLs for well-known OpenAI-compatible providers. Any provider can
 * also be reached by passing an explicit `baseURL` — this map is convenience.
 */
export const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
  deepseek: 'https://api.deepseek.com',
  openrouter: 'https://openrouter.ai/api/v1',
  xai: 'https://api.x.ai/v1',
  cerebras: 'https://api.cerebras.ai/v1',
};

/**
 * Adapters for providers that are NOT OpenAI-compliant (Anthropic, Bedrock, …).
 * Empty for now — filled in incrementally as those providers are added.
 */
const SPECIAL_ADAPTERS: Record<string, ProviderAdapter> = {};

/**
 * Resolve the adapter for a provider. Defaults to OpenAI-compatible pass-through
 * for anything without a special adapter — the core of the design: OpenAI by
 * default, deltas only where a provider actually diverges.
 */
export function getAdapter(
  provider: string,
  overrides?: Record<string, ProviderAdapter>,
): ProviderAdapter {
  return (
    overrides?.[provider] ??
    SPECIAL_ADAPTERS[provider] ??
    openaiCompatible(provider)
  );
}
