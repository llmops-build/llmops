/**
 * Pricing types for cost tracking
 */

/**
 * Model pricing information
 * All costs are in dollars per 1 million tokens
 */
export interface ModelPricing {
  /** Cost per 1M input/prompt tokens in dollars */
  inputCostPer1M: number;
  /** Cost per 1M output/completion tokens in dollars */
  outputCostPer1M: number;
  /** Cost per 1M cached read tokens in dollars (optional) */
  cacheReadCostPer1M?: number;
  /** Cost per 1M cached write tokens in dollars (optional) */
  cacheWriteCostPer1M?: number;
  /** Cost per 1M reasoning tokens in dollars (optional, for models like o1) */
  reasoningCostPer1M?: number;
}

/**
 * Token usage data from LLM response
 */
export interface UsageData {
  /** Number of tokens in the prompt/input */
  promptTokens: number;
  /** Number of tokens in the completion/output */
  completionTokens: number;
  /** Total tokens (prompt + completion) */
  totalTokens?: number;
  /** Number of cached tokens (optional) */
  cachedTokens?: number;
  /** Number of reasoning tokens (optional, for models like o1) */
  reasoningTokens?: number;
}

/**
 * Cost calculation result
 * All costs are in micro-dollars (1 dollar = 1,000,000 micro-dollars)
 * This avoids floating-point precision issues
 */
export interface CostResult {
  /** Total cost in micro-dollars */
  totalCost: number;
  /** Input/prompt cost in micro-dollars */
  inputCost: number;
  /** Output/completion cost in micro-dollars */
  outputCost: number;
}

/**
 * Provider for fetching model pricing data
 * Abstracted to allow swapping data sources (models.dev, local JSON, etc.)
 */
export interface PricingProvider {
  /**
   * Get pricing for a specific model
   * @param provider - Provider name (e.g., "openai", "anthropic")
   * @param model - Model identifier (e.g., "gpt-4o", "claude-3-sonnet")
   * @returns Model pricing or null if not found
   */
  getModelPricing(
    provider: string,
    model: string
  ): Promise<ModelPricing | null>;

  /**
   * Force refresh the pricing cache
   */
  refreshCache(): Promise<void>;

  /**
   * Check if the provider is ready (cache is populated)
   */
  isReady(): boolean;
}
