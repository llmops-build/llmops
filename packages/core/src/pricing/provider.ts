import type { ModelPricing, PricingProvider } from './types';
import { edgeLogger as logger } from '../utils/edge-logger';

const MODELS_DEV_API = 'https://models.dev/api.json';

/**
 * Models.dev API response types
 */
interface ModelsDevModel {
  id: string;
  name: string;
  cost: {
    input: number; // Cost per 1M input tokens
    output: number; // Cost per 1M output tokens
    reasoning?: number;
    cache_read?: number;
    cache_write?: number;
  };
}

interface ModelsDevProvider {
  id: string;
  name: string;
  models: Record<string, ModelsDevModel>;
}

type ModelsDevResponse = Record<string, ModelsDevProvider>;

/**
 * Pricing provider that fetches data from models.dev API
 *
 * Features:
 * - Caches pricing data with configurable TTL (default 5 minutes)
 * - Supports fallback to local cache on fetch failure
 * - Thread-safe cache refresh
 */
export class ModelsDevPricingProvider implements PricingProvider {
  private cache: Map<string, ModelPricing> = new Map();
  private lastFetch: number = 0;
  private cacheTTL: number;
  private fetchPromise: Promise<void> | null = null;
  private ready: boolean = false;

  /**
   * Create a new ModelsDevPricingProvider
   *
   * @param cacheTTL - Cache TTL in milliseconds (default: 5 minutes)
   */
  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.cacheTTL = cacheTTL;
  }

  /**
   * Generate a cache key for a provider/model combination
   */
  private getCacheKey(provider: string, model: string): string {
    return `${provider.toLowerCase()}:${model.toLowerCase()}`;
  }

  /**
   * Fetch pricing data from models.dev API
   */
  private async fetchPricingData(): Promise<void> {
    try {
      logger.debug('[Pricing] Fetching pricing data from models.dev');
      const response = await fetch(MODELS_DEV_API);

      if (!response.ok) {
        throw new Error(`Failed to fetch models.dev API: ${response.status}`);
      }

      const data = (await response.json()) as ModelsDevResponse;

      // Clear and rebuild cache
      this.cache.clear();

      for (const [providerId, provider] of Object.entries(data)) {
        if (!provider.models) continue;

        for (const [_modelId, model] of Object.entries(provider.models)) {
          if (!model.cost) continue;

          const cacheKey = this.getCacheKey(providerId, model.id);
          this.cache.set(cacheKey, {
            inputCostPer1M: model.cost.input ?? 0,
            outputCostPer1M: model.cost.output ?? 0,
            cacheReadCostPer1M: model.cost.cache_read,
            cacheWriteCostPer1M: model.cost.cache_write,
            reasoningCostPer1M: model.cost.reasoning,
          });

          // Also store with model name as key for flexibility
          const nameKey = this.getCacheKey(providerId, model.name);
          if (nameKey !== cacheKey) {
            this.cache.set(nameKey, this.cache.get(cacheKey)!);
          }
        }
      }

      this.lastFetch = Date.now();
      this.ready = true;
      logger.debug(
        `[Pricing] Cached pricing for ${this.cache.size} models from models.dev`
      );
    } catch (error) {
      logger.error(
        `[Pricing] Failed to fetch pricing data: ${error instanceof Error ? error.message : String(error)}`
      );
      // Keep existing cache on failure
      if (this.cache.size === 0) {
        throw error;
      }
    }
  }

  /**
   * Ensure cache is fresh, fetching if necessary
   */
  private async ensureFreshCache(): Promise<void> {
    const now = Date.now();
    const isStale = now - this.lastFetch > this.cacheTTL;

    if (!isStale && this.cache.size > 0) {
      return;
    }

    // Use a single promise to prevent concurrent fetches
    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchPricingData().finally(() => {
        this.fetchPromise = null;
      });
    }

    await this.fetchPromise;
  }

  /**
   * Get pricing for a specific model
   */
  async getModelPricing(
    provider: string,
    model: string
  ): Promise<ModelPricing | null> {
    await this.ensureFreshCache();

    const cacheKey = this.getCacheKey(provider, model);
    const pricing = this.cache.get(cacheKey);

    if (!pricing) {
      logger.debug(
        `[Pricing] No pricing found for ${provider}/${model}, trying partial match`
      );

      // Try partial match - some models have version suffixes
      for (const [key, value] of this.cache.entries()) {
        if (key.startsWith(`${provider.toLowerCase()}:`)) {
          const modelPart = key.split(':')[1];
          if (model.toLowerCase().includes(modelPart)) {
            logger.debug(`[Pricing] Found partial match: ${key}`);
            return value;
          }
        }
      }

      return null;
    }

    return pricing;
  }

  /**
   * Force refresh the pricing cache
   */
  async refreshCache(): Promise<void> {
    this.lastFetch = 0; // Force stale
    await this.ensureFreshCache();
  }

  /**
   * Check if the provider is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Get the number of cached models (for debugging)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance for convenience
let defaultProvider: ModelsDevPricingProvider | null = null;

/**
 * Get the default pricing provider instance
 */
export function getDefaultPricingProvider(): ModelsDevPricingProvider {
  if (!defaultProvider) {
    defaultProvider = new ModelsDevPricingProvider();
  }
  return defaultProvider;
}
