import { openaiCompatible } from './openai-compatible';
import type { ProviderAdapter } from './types';

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
