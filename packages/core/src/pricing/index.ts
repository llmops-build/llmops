/**
 * Pricing module for LLM cost tracking
 *
 * This module provides:
 * - Types for model pricing and cost calculation
 * - Cost calculator with micro-dollar precision
 * - Pricing provider abstraction with models.dev implementation
 *
 * @example
 * ```typescript
 * import {
 *   calculateCost,
 *   getDefaultPricingProvider,
 *   formatCost,
 * } from '@llmops/core/pricing';
 *
 * // Get pricing for a model
 * const provider = getDefaultPricingProvider();
 * const pricing = await provider.getModelPricing('openai', 'gpt-4o');
 *
 * // Calculate cost
 * const usage = { promptTokens: 1000, completionTokens: 500 };
 * const cost = calculateCost(usage, pricing);
 *
 * // Format for display
 * console.log(formatCost(cost.totalCost)); // "$0.007500"
 * ```
 */

// Types
export type {
  ModelPricing,
  UsageData,
  CostResult,
  PricingProvider,
} from './types';

// Calculator
export {
  calculateCost,
  microDollarsToDollars,
  dollarsToMicroDollars,
  formatCost,
} from './calculator';

// Providers
export {
  ModelsDevPricingProvider,
  getDefaultPricingProvider,
} from './provider';
