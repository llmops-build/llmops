import type { ModelPricing, PricingProvider } from './types';
import { logger } from '../utils/logger';
import { getPricingData } from '@llmops/models';

/**
 * Pricing provider that uses static data from @llmops/models.
 * No runtime HTTP fetches — data is bundled at build time.
 */
export class LocalPricingProvider implements PricingProvider {
  private data: Map<string, ModelPricing>;

  constructor() {
    const pricingData = getPricingData();
    this.data = new Map(
      Object.entries(pricingData).map(([key, value]) => [
        key.toLowerCase(),
        value as ModelPricing,
      ])
    );
    logger.debug(
      `[Pricing] Loaded ${this.data.size} model pricing entries from @llmops/models`
    );
  }

  async getModelPricing(
    provider: string,
    model: string
  ): Promise<ModelPricing | null> {
    const key = `${provider.toLowerCase()}:${model.toLowerCase()}`;
    const pricing = this.data.get(key);

    if (!pricing) {
      // Try partial match - some models have version suffixes
      for (const [k, value] of this.data.entries()) {
        if (k.startsWith(`${provider.toLowerCase()}:`)) {
          const modelPart = k.split(':')[1];
          if (model.toLowerCase().includes(modelPart)) {
            return value;
          }
        }
      }
      return null;
    }

    return pricing;
  }

  async refreshCache(): Promise<void> {
    // No-op for static data
  }

  isReady(): boolean {
    return true;
  }

  getCacheSize(): number {
    return this.data.size;
  }
}

// Singleton instance
let defaultProvider: LocalPricingProvider | null = null;

/**
 * Get the default pricing provider instance (uses bundled data from @llmops/models)
 */
export function getDefaultPricingProvider(): LocalPricingProvider {
  if (!defaultProvider) {
    defaultProvider = new LocalPricingProvider();
  }
  return defaultProvider;
}
