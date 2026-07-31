import { getDefaultPricingProvider } from './provider';
import type { ModelPricing } from './types';

/**
 * Default model-pricing resolver — fetches pricing from models.llmops.build and
 * caches it (TTL / dedupe / stale-fallback, via the default pricing provider).
 *
 * The sibling of `getProviderMetadata`. Unlike provider metadata (bundled),
 * pricing is fetched at runtime: it's dynamic, large, and off the routing hot
 * path. Override via `llmops({ getModelPricing })`.
 */
export function getModelPricing(
  provider: string,
  model: string,
  inputTokens?: number,
): Promise<ModelPricing | null> {
  return getDefaultPricingProvider().getModelPricing(
    provider,
    model,
    inputTokens,
  );
}
