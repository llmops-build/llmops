import { logger } from '../utils/logger';
import type { ModelPricing, PricingProvider } from './types';

const LLMOPS_MODELS_API = 'https://models.llmops.build';

/**
 * LLMOps Models API response types
 */
interface PricingTokenConfig {
  price: number; // USD cents per token
}

interface PayAsYouGoPricing {
  request_token?: PricingTokenConfig;
  response_token?: PricingTokenConfig;
  cache_write_input_token?: PricingTokenConfig;
  cache_read_input_token?: PricingTokenConfig;
}

interface PricingResponse {
  pay_as_you_go: PayAsYouGoPricing | null;
  currency?: string;
}

interface CacheEntry {
  pricing: ModelPricing | null;
  fetchedAt: number;
}

/**
 * Convert price from USD cents per token to dollars per 1M tokens.
 *
 * API returns cents/token. Our system uses dollars/1M tokens.
 * Formula: (centsPerToken / 100) * 1_000_000 = centsPerToken * 10_000
 */
function centsPerTokenToCostPer1M(centsPerToken: number): number {
  return centsPerToken * 10_000;
}

/**
 * Pricing provider that fetches per-model data from the LLMOps Models API.
 *
 * Features:
 * - Per-model in-memory cache with configurable TTL (default 5 minutes)
 * - Deduplicates concurrent fetches for the same model
 * - Caches null results (404s) to avoid repeated lookups
 * - Falls back to stale cache on fetch errors
 */
export class LLMOpsPricingProvider implements PricingProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingFetches: Map<string, Promise<ModelPricing | null>> = new Map();
  private cacheTTL: number;
  private baseUrl: string;

  constructor(options?: { cacheTTL?: number; baseUrl?: string }) {
    this.cacheTTL = options?.cacheTTL ?? 5 * 60 * 1000; // 5 minutes
    this.baseUrl = options?.baseUrl ?? LLMOPS_MODELS_API;
  }

  private getCacheKey(provider: string, model: string): string {
    return `${provider.toLowerCase()}:${model.toLowerCase()}`;
  }

  /**
   * Fetch pricing for a single model from the API
   */
  private async fetchModelPricing(
    provider: string,
    model: string,
  ): Promise<ModelPricing | null> {
    // Model names can contain slashes (e.g. meta-llama/Llama-3.3-70B-Instruct)
    // The API routing captures them correctly, so don't encode the model
    const url = `${this.baseUrl}/model-configs/pricing/${encodeURIComponent(provider)}/${model}`;

    try {
      logger.debug(`[Pricing] GET ${url}`);
      const startTime = Date.now();
      const response = await fetch(url);
      const elapsed = Date.now() - startTime;
      logger.debug(`[Pricing] GET ${url} -> ${response.status} (${elapsed}ms)`);

      if (response.status === 404) {
        logger.debug(`[Pricing] No pricing found for ${provider}/${model}`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = (await response.json()) as PricingResponse;

      if (!data.pay_as_you_go) {
        // null pay_as_you_go means deprecated or free model
        return null;
      }

      const payg = data.pay_as_you_go;

      const pricing: ModelPricing = {
        inputCostPer1M: centsPerTokenToCostPer1M(
          payg.request_token?.price ?? 0,
        ),
        outputCostPer1M: centsPerTokenToCostPer1M(
          payg.response_token?.price ?? 0,
        ),
        cacheReadCostPer1M:
          payg.cache_read_input_token?.price != null
            ? centsPerTokenToCostPer1M(payg.cache_read_input_token.price)
            : undefined,
        cacheWriteCostPer1M:
          payg.cache_write_input_token?.price != null
            ? centsPerTokenToCostPer1M(payg.cache_write_input_token.price)
            : undefined,
      };

      logger.debug(
        `[Pricing] Cached pricing for ${provider}/${model}: input=$${pricing.inputCostPer1M}/1M, output=$${pricing.outputCostPer1M}/1M`,
      );

      return pricing;
    } catch (error) {
      logger.error(
        `[Pricing] Failed to fetch pricing for ${provider}/${model}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Return stale cache if available
      const cacheKey = this.getCacheKey(provider, model);
      const stale = this.cache.get(cacheKey);
      if (stale) {
        logger.debug(`[Pricing] Using stale cache for ${provider}/${model}`);
        return stale.pricing;
      }

      return null;
    }
  }

  /**
   * Internal: fetch with cache and deduplication for a specific provider+model
   */
  private async getCachedPricing(
    provider: string,
    model: string,
  ): Promise<ModelPricing | null> {
    const cacheKey = this.getCacheKey(provider, model);

    // Check fresh cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTTL) {
      return cached.pricing;
    }

    // Deduplicate concurrent fetches for the same model
    let pending = this.pendingFetches.get(cacheKey);
    if (!pending) {
      pending = this.fetchModelPricing(provider, model)
        .then((pricing) => {
          this.cache.set(cacheKey, { pricing, fetchedAt: Date.now() });
          return pricing;
        })
        .finally(() => {
          this.pendingFetches.delete(cacheKey);
        });
      this.pendingFetches.set(cacheKey, pending);
    }

    return pending;
  }

  /**
   * Get pricing for a specific model.
   *
   * When the model name contains a slash (e.g. "google/gemini-2.5-flash"),
   * it's likely an OpenRouter model ID. If the initial provider lookup fails,
   * we automatically retry with "openrouter" as the provider.
   */
  async getModelPricing(
    provider: string,
    model: string,
    inputTokens?: number,
  ): Promise<ModelPricing | null> {
    const pricing = await this.getCachedPricing(provider, model);
    if (pricing) return pricing;

    // Some catalog entries are split by context window even though the
    // upstream API uses one bare model id (for example gemini-2.5-flash).
    // Resolve that catalog tier after the canonical lookup so providers with a
    // direct entry remain untouched.
    if (
      provider.toLowerCase() === 'google' &&
      !/(?:-lte-128k|-gt-128k)$/.test(model)
    ) {
      const tier = (inputTokens ?? 0) > 128_000 ? 'gt' : 'lte';
      const tiered = await this.getCachedPricing(
        provider,
        `${model}-${tier}-128k`,
      );
      if (tiered) return tiered;
    }

    // Model names with slashes (e.g. "google/gemini-2.5-flash") are OpenRouter
    // model IDs. When the caller's provider (often "openai" from gen_ai.system)
    // doesn't match, fall back to openrouter.
    if (
      !pricing &&
      model.includes('/') &&
      provider.toLowerCase() !== 'openrouter'
    ) {
      logger.debug(
        `[Pricing] Retrying ${provider}/${model} as openrouter/${model}`,
      );
      return this.getCachedPricing('openrouter', model);
    }

    return pricing;
  }

  /**
   * Force refresh the pricing cache (clears all cached entries)
   */
  async refreshCache(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Always ready — no bulk pre-fetch needed
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Get the number of cached models (for debugging)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
let defaultProvider: LLMOpsPricingProvider | null = null;

/**
 * Get the default pricing provider instance
 */
export function getDefaultPricingProvider(): LLMOpsPricingProvider {
  if (!defaultProvider) {
    defaultProvider = new LLMOpsPricingProvider();
  }
  return defaultProvider;
}
