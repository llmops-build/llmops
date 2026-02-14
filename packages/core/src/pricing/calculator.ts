import type { ModelPricing, UsageData, CostResult } from './types';

/**
 * Calculate the cost of an LLM request in micro-dollars
 *
 * Micro-dollars are used to avoid floating-point precision issues:
 * - 1 dollar = 1,000,000 micro-dollars
 * - $0.001 = 1,000 micro-dollars
 * - $0.000001 = 1 micro-dollar
 *
 * @param usage - Token usage data from the LLM response
 * @param pricing - Model pricing information
 * @returns Cost breakdown in micro-dollars
 *
 * @example
 * ```typescript
 * const usage = { promptTokens: 1000, completionTokens: 500 };
 * const pricing = { inputCostPer1M: 2.5, outputCostPer1M: 10.0 };
 * const cost = calculateCost(usage, pricing);
 * // cost = { inputCost: 2500, outputCost: 5000, totalCost: 7500 }
 * // In dollars: $0.0025 input + $0.005 output = $0.0075 total
 * ```
 */
export function calculateCost(
  usage: UsageData,
  pricing: ModelPricing
): CostResult {
  // Calculate input cost: (tokens / 1M) * costPer1M * 1M (convert to micro-dollars)
  // Simplified: tokens * costPer1M
  const inputCost = Math.round(usage.promptTokens * pricing.inputCostPer1M);

  // Calculate output cost
  const outputCost = Math.round(
    usage.completionTokens * pricing.outputCostPer1M
  );

  // Total cost
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
  };
}

/**
 * Get default cache read rate as a fraction of input cost per provider.
 * Used when models.dev doesn't provide cache pricing.
 */
function getDefaultCacheReadRate(
  provider: string | undefined,
  inputCostPer1M: number
): number {
  switch (provider?.toLowerCase()) {
    case 'anthropic':
      return inputCostPer1M * 0.1; // 10% of input price
    case 'openai':
    case 'azure-openai':
      return inputCostPer1M * 0.5; // 50% of input price
    case 'google':
    case 'gemini':
    case 'vertex_ai':
      return inputCostPer1M * 0.25; // 25% of input price
    default:
      return inputCostPer1M * 0.5; // Conservative default
  }
}

/**
 * Get default cache write/creation rate as a fraction of input cost per provider.
 * Used when models.dev doesn't provide cache pricing.
 */
function getDefaultCacheWriteRate(
  provider: string | undefined,
  inputCostPer1M: number
): number {
  switch (provider?.toLowerCase()) {
    case 'anthropic':
      return inputCostPer1M * 1.25; // 125% of input price
    default:
      return inputCostPer1M; // Same as input (no write premium)
  }
}

/**
 * Calculate cache-aware cost of an LLM request in micro-dollars.
 *
 * Splits input tokens into uncached, cache-read, and cache-creation buckets,
 * each priced at different rates. Falls back to provider-specific multipliers
 * when models.dev doesn't provide cache pricing.
 *
 * @param usage - Token usage data (with cachedTokens and cacheCreationTokens)
 * @param pricing - Model pricing (may include cacheReadCostPer1M / cacheWriteCostPer1M)
 * @param provider - Provider name for fallback rate selection
 * @returns Cost breakdown in micro-dollars
 */
export function calculateCacheAwareCost(
  usage: UsageData,
  pricing: ModelPricing,
  provider?: string
): CostResult {
  const cachedTokens = usage.cachedTokens ?? 0;
  const cacheCreationTokens = usage.cacheCreationTokens ?? 0;

  // If no cache tokens, use the simple calculation
  if (cachedTokens === 0 && cacheCreationTokens === 0) {
    return calculateCost(usage, pricing);
  }

  // Determine cache pricing rates
  const cacheReadRate =
    pricing.cacheReadCostPer1M ??
    getDefaultCacheReadRate(provider, pricing.inputCostPer1M);
  const cacheWriteRate =
    pricing.cacheWriteCostPer1M ??
    getDefaultCacheWriteRate(provider, pricing.inputCostPer1M);

  // Uncached input = total prompt minus cached and creation tokens
  const uncachedInputTokens = Math.max(
    0,
    usage.promptTokens - cachedTokens - cacheCreationTokens
  );

  const regularInputCost = Math.round(
    uncachedInputTokens * pricing.inputCostPer1M
  );
  const cacheReadCost = Math.round(cachedTokens * cacheReadRate);
  const cacheWriteCost = Math.round(cacheCreationTokens * cacheWriteRate);
  const outputCost = Math.round(
    usage.completionTokens * pricing.outputCostPer1M
  );

  const inputCost = regularInputCost + cacheReadCost + cacheWriteCost;
  const totalCost = inputCost + outputCost;

  return { inputCost, outputCost, totalCost };
}

/**
 * Convert micro-dollars to dollars
 *
 * @param microDollars - Amount in micro-dollars
 * @returns Amount in dollars
 *
 * @example
 * ```typescript
 * microDollarsToDollars(7500); // 0.0075
 * microDollarsToDollars(1000000); // 1.0
 * ```
 */
export function microDollarsToDollars(microDollars: number): number {
  return microDollars / 1_000_000;
}

/**
 * Convert dollars to micro-dollars
 *
 * @param dollars - Amount in dollars
 * @returns Amount in micro-dollars (rounded to nearest integer)
 *
 * @example
 * ```typescript
 * dollarsToMicroDollars(0.0075); // 7500
 * dollarsToMicroDollars(1.0); // 1000000
 * ```
 */
export function dollarsToMicroDollars(dollars: number): number {
  return Math.round(dollars * 1_000_000);
}

/**
 * Format micro-dollars as a human-readable dollar string
 *
 * @param microDollars - Amount in micro-dollars
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted dollar string
 *
 * @example
 * ```typescript
 * formatCost(7500); // "$0.007500"
 * formatCost(1234567, 2); // "$1.23"
 * ```
 */
export function formatCost(microDollars: number, decimals = 6): string {
  const dollars = microDollarsToDollars(microDollars);
  return `$${dollars.toFixed(decimals)}`;
}
