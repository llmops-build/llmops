import pricingData from '../generated/pricing.json';
import modelsDevCompat from '../generated/models-dev-compat.json';
import type {
  PricingMap,
  ModelPricing,
  ModelsDevCompatData,
} from './types';

export type {
  PricingMap,
  ModelPricing,
  ModelsDevCompatData,
  ModelsDevCompatModel,
  ModelsDevCompatProvider,
} from './types';

/**
 * Get the full pricing map: "provider:model" -> ModelPricing
 */
export function getPricingData(): PricingMap {
  return pricingData as PricingMap;
}

/**
 * Get models.dev API-compatible data (keyed by provider ID).
 */
export function getModelsDevCompatData(): ModelsDevCompatData {
  return modelsDevCompat as ModelsDevCompatData;
}

/**
 * Get pricing for a specific provider/model combination.
 * Returns null if not found.
 */
export function getModelPricing(
  provider: string,
  model: string
): ModelPricing | null {
  const key = `${provider.toLowerCase()}:${model.toLowerCase()}`;
  const data = pricingData as PricingMap;
  return data[key] ?? null;
}
