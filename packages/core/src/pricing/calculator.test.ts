import { describe, test, expect } from 'vitest';
import {
  calculateCost,
  calculateCacheAwareCost,
  microDollarsToDollars,
  dollarsToMicroDollars,
  formatCost,
} from './calculator';
import type { ModelPricing, UsageData } from './types';

describe('calculateCost', () => {
  test('calculates basic input and output cost', () => {
    const usage: UsageData = { promptTokens: 1000, completionTokens: 500 };
    const pricing: ModelPricing = {
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
    };
    const result = calculateCost(usage, pricing);
    expect(result.inputCost).toBe(2500);
    expect(result.outputCost).toBe(5000);
    expect(result.totalCost).toBe(7500);
  });

  test('handles zero tokens', () => {
    const usage: UsageData = { promptTokens: 0, completionTokens: 0 };
    const pricing: ModelPricing = {
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
    };
    const result = calculateCost(usage, pricing);
    expect(result.inputCost).toBe(0);
    expect(result.outputCost).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  test('rounds to nearest integer', () => {
    const usage: UsageData = { promptTokens: 1, completionTokens: 1 };
    const pricing: ModelPricing = {
      inputCostPer1M: 0.3,
      outputCostPer1M: 0.7,
    };
    const result = calculateCost(usage, pricing);
    // 1 * 0.3 = 0.3 -> rounds to 0
    // 1 * 0.7 = 0.7 -> rounds to 1
    expect(result.inputCost).toBe(0);
    expect(result.outputCost).toBe(1);
    expect(result.totalCost).toBe(1);
  });
});

describe('calculateCacheAwareCost', () => {
  const basePricing: ModelPricing = {
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  };

  test('falls back to calculateCost when no cache tokens', () => {
    const usage: UsageData = { promptTokens: 1000, completionTokens: 500 };
    const result = calculateCacheAwareCost(usage, basePricing);
    const basicResult = calculateCost(usage, basePricing);
    expect(result).toEqual(basicResult);
  });

  test('falls back to calculateCost when cache tokens are zero', () => {
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 500,
      cachedTokens: 0,
      cacheCreationTokens: 0,
    };
    const result = calculateCacheAwareCost(usage, basePricing);
    const basicResult = calculateCost(usage, basePricing);
    expect(result).toEqual(basicResult);
  });

  test('OpenAI cache: cached tokens at 50% of input rate', () => {
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 200,
      cachedTokens: 600,
    };
    // uncachedInput = 1000 - 600 = 400
    // regularInputCost = 400 * 3.0 = 1200
    // cacheReadCost = 600 * (3.0 * 0.5) = 900
    // outputCost = 200 * 15.0 = 3000
    const result = calculateCacheAwareCost(usage, basePricing, 'openai');
    expect(result.inputCost).toBe(1200 + 900); // 2100
    expect(result.outputCost).toBe(3000);
    expect(result.totalCost).toBe(5100);
  });

  test('Anthropic cache: read at 10%, creation at 125%', () => {
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 200,
      cachedTokens: 400, // cache_read_input_tokens
      cacheCreationTokens: 300, // cache_creation_input_tokens
    };
    // uncachedInput = max(0, 1000 - 400 - 300) = 300
    // regularInputCost = 300 * 3.0 = 900
    // cacheReadCost = 400 * (3.0 * 0.1) = 120
    // cacheWriteCost = 300 * (3.0 * 1.25) = 1125
    // outputCost = 200 * 15.0 = 3000
    const result = calculateCacheAwareCost(usage, basePricing, 'anthropic');
    expect(result.inputCost).toBe(900 + 120 + 1125); // 2145
    expect(result.outputCost).toBe(3000);
    expect(result.totalCost).toBe(5145);
  });

  test('uses explicit cache pricing from models.dev when available', () => {
    const pricingWithCache: ModelPricing = {
      inputCostPer1M: 3.0,
      outputCostPer1M: 15.0,
      cacheReadCostPer1M: 0.5,
      cacheWriteCostPer1M: 4.0,
    };
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 200,
      cachedTokens: 400,
      cacheCreationTokens: 200,
    };
    // uncachedInput = 1000 - 400 - 200 = 400
    // regularInputCost = 400 * 3.0 = 1200
    // cacheReadCost = 400 * 0.5 = 200
    // cacheWriteCost = 200 * 4.0 = 800
    // outputCost = 200 * 15.0 = 3000
    const result = calculateCacheAwareCost(usage, pricingWithCache, 'anthropic');
    expect(result.inputCost).toBe(1200 + 200 + 800); // 2200
    expect(result.outputCost).toBe(3000);
    expect(result.totalCost).toBe(5200);
  });

  test('all input tokens are cached', () => {
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 100,
      cachedTokens: 1000,
    };
    // uncachedInput = max(0, 1000 - 1000) = 0
    // regularInputCost = 0
    // cacheReadCost = 1000 * (3.0 * 0.5) = 1500 (default provider)
    // outputCost = 100 * 15.0 = 1500
    const result = calculateCacheAwareCost(usage, basePricing);
    expect(result.inputCost).toBe(1500);
    expect(result.outputCost).toBe(1500);
    expect(result.totalCost).toBe(3000);
  });

  test('Google/Gemini cache: read at 25%', () => {
    const usage: UsageData = {
      promptTokens: 1000,
      completionTokens: 0,
      cachedTokens: 1000,
    };
    // All cached at 25% of input rate
    // cacheReadCost = 1000 * (3.0 * 0.25) = 750
    const result = calculateCacheAwareCost(usage, basePricing, 'google');
    expect(result.inputCost).toBe(750);
    expect(result.outputCost).toBe(0);
    expect(result.totalCost).toBe(750);
  });

  test('uncachedInput never goes negative', () => {
    const usage: UsageData = {
      promptTokens: 100,
      completionTokens: 50,
      cachedTokens: 80,
      cacheCreationTokens: 80, // sum exceeds promptTokens
    };
    // uncachedInput = max(0, 100 - 80 - 80) = 0
    const result = calculateCacheAwareCost(usage, basePricing, 'openai');
    expect(result.inputCost).toBeGreaterThanOrEqual(0);
    expect(result.totalCost).toBeGreaterThanOrEqual(0);
  });
});

describe('conversion utilities', () => {
  test('microDollarsToDollars', () => {
    expect(microDollarsToDollars(1_000_000)).toBe(1.0);
    expect(microDollarsToDollars(7500)).toBe(0.0075);
    expect(microDollarsToDollars(0)).toBe(0);
  });

  test('dollarsToMicroDollars', () => {
    expect(dollarsToMicroDollars(1.0)).toBe(1_000_000);
    expect(dollarsToMicroDollars(0.0075)).toBe(7500);
    expect(dollarsToMicroDollars(0)).toBe(0);
  });

  test('formatCost', () => {
    expect(formatCost(7500)).toBe('$0.007500');
    expect(formatCost(1234567, 2)).toBe('$1.23');
    expect(formatCost(0)).toBe('$0.000000');
  });
});
