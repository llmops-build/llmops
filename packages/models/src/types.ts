/**
 * Model pricing in dollars per 1M tokens.
 * Matches the ModelPricing interface in @llmops/core.
 */
export interface ModelPricing {
  inputCostPer1M: number;
  outputCostPer1M: number;
  cacheReadCostPer1M?: number;
  cacheWriteCostPer1M?: number;
}

/**
 * Flat pricing map: "provider:model" -> ModelPricing
 */
export type PricingMap = Record<string, ModelPricing>;

/**
 * Models.dev compatible model entry
 */
export interface ModelsDevCompatModel {
  id: string;
  name: string;
  tool_call: boolean;
  attachment: boolean;
  reasoning: boolean;
  cost: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  limit: {
    context: number;
    output: number;
  };
}

/**
 * Models.dev compatible provider entry
 */
export interface ModelsDevCompatProvider {
  id: string;
  name: string;
  models: Record<string, ModelsDevCompatModel>;
}

/**
 * Models.dev API-compatible data structure.
 * Keyed by provider ID.
 */
export type ModelsDevCompatData = Record<string, ModelsDevCompatProvider>;
