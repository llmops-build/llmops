import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'node:crypto';
import { logger } from '@llmops/core';
import {
  wrapStreamingResponse,
  ensureStreamUsageEnabled,
} from '@server/lib/streamingCostExtractor';
import {
  getGlobalBatchWriter,
  type LLMRequestData,
} from '@server/services/batchWriter';

/**
 * Model pricing information
 * All costs are in dollars per 1 million tokens
 */
interface ModelPricing {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

/**
 * Cost calculation result in micro-dollars
 */
interface CostResult {
  totalCost: number;
  inputCost: number;
  outputCost: number;
}

/**
 * Calculate cost in micro-dollars
 * 1 dollar = 1,000,000 micro-dollars
 */
function calculateCost(
  usage: { promptTokens: number; completionTokens: number },
  pricing: ModelPricing
): CostResult {
  const inputCost = Math.round(usage.promptTokens * pricing.inputCostPer1M);
  const outputCost = Math.round(
    usage.completionTokens * pricing.outputCostPer1M
  );
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Simple pricing provider that fetches from models.dev
 */
class PricingProvider {
  private cache: Map<string, ModelPricing> = new Map();
  private lastFetch = 0;
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private fetchPromise: Promise<void> | null = null;

  private getCacheKey(provider: string, model: string): string {
    return `${provider.toLowerCase()}:${model.toLowerCase()}`;
  }

  private async fetchPricingData(): Promise<void> {
    try {
      const response = await fetch('https://models.dev/api.json');
      if (!response.ok) return;

      const data = await response.json();
      this.cache.clear();

      for (const [providerId, provider] of Object.entries(data)) {
        const p = provider as {
          models?: Record<
            string,
            { id: string; cost?: { input: number; output: number } }
          >;
        };
        if (!p.models) continue;

        for (const [, model] of Object.entries(p.models)) {
          if (!model.cost) continue;

          const cacheKey = this.getCacheKey(providerId, model.id);
          this.cache.set(cacheKey, {
            inputCostPer1M: model.cost.input ?? 0,
            outputCostPer1M: model.cost.output ?? 0,
          });
        }
      }

      this.lastFetch = Date.now();
    } catch {
      // Keep existing cache on failure
    }
  }

  private async ensureFreshCache(): Promise<void> {
    if (Date.now() - this.lastFetch < this.cacheTTL && this.cache.size > 0) {
      return;
    }

    if (!this.fetchPromise) {
      this.fetchPromise = this.fetchPricingData().finally(() => {
        this.fetchPromise = null;
      });
    }

    await this.fetchPromise;
  }

  async getModelPricing(
    provider: string,
    model: string
  ): Promise<ModelPricing | null> {
    await this.ensureFreshCache();
    return this.cache.get(this.getCacheKey(provider, model)) || null;
  }
}

const pricingProvider = new PricingProvider();

/**
 * OpenAI-compatible usage structure in response body
 */
interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

/**
 * OpenAI-compatible response body
 */
interface OpenAIResponse {
  usage?: OpenAIUsage;
}

/**
 * Context for request tracking
 */
interface RequestContext {
  requestId: string;
  startTime: number;
  provider: string;
  model: string;
  configId?: string;
  endpoint: string;
  isStreaming: boolean;
}

/**
 * Augment Hono context with cost tracking variables
 */
declare module 'hono' {
  interface ContextVariableMap {
    configId?: string;
    envSec?: string;
    variantConfig?: Record<string, unknown>;
    variantModel?: string;
    variantId?: string;
    __costTrackingContext?: RequestContext;
  }
}

/**
 * Configuration for cost tracking middleware
 */
export interface CostTrackingConfig {
  /** Whether cost tracking is enabled (default: true) */
  enabled?: boolean;
  /** Whether to track failed requests (default: true) */
  trackErrors?: boolean;
  /** BatchWriter flush interval in ms (default: 2000) */
  flushIntervalMs?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Database interface with batch insert
 * Cast db to this type since batchInsertRequests is added by createLLMRequestsDataLayer
 */
interface DbWithBatchInsert {
  batchInsertRequests: (
    requests: LLMRequestData[]
  ) => Promise<{ count: number }>;
}

/**
 * Creates cost tracking middleware that logs LLM requests with usage and cost data.
 *
 * Features:
 * - Tracks both streaming and non-streaming requests
 * - Calculates costs using models.dev pricing data
 * - Batches database writes for performance
 * - Adds x-llmops-request-id header for tracing
 */
export function createCostTrackingMiddleware(
  config: CostTrackingConfig = {}
): MiddlewareHandler {
  const {
    enabled = true,
    trackErrors = true,
    flushIntervalMs = 2000,
    debug = false,
  } = config;

  const log = debug
    ? (msg: string) => logger.debug(`[CostTracking] ${msg}`)
    : () => {};

  return async (c, next) => {
    if (!enabled) {
      return next();
    }

    // Only track chat completions and completions endpoints
    const path = c.req.path;
    if (!path.endsWith('/chat/completions') && !path.endsWith('/completions')) {
      return next();
    }

    // Generate request ID for tracing
    const requestId = randomUUID();
    const startTime = Date.now();

    // Set request ID header early
    c.header('x-llmops-request-id', requestId);

    // Parse request body to detect streaming and ensure usage is included
    let body: Record<string, unknown> = {};
    let isStreaming = false;

    try {
      const clonedReq = c.req.raw.clone();
      body = await clonedReq.json();
      isStreaming = body.stream === true;

      // For streaming requests, ensure include_usage is set
      if (isStreaming) {
        body = ensureStreamUsageEnabled(body);

        // Update the request body
        const newHeaders = new Headers(c.req.raw.headers);
        const newRequest = new Request(c.req.raw.url, {
          method: c.req.raw.method,
          headers: newHeaders,
          body: JSON.stringify(body),
          duplex: 'half',
        } as RequestInit);

        Object.defineProperty(c.req, 'raw', {
          value: newRequest,
          writable: true,
          configurable: true,
        });
        (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache =
          {};
      }
    } catch {
      log('Failed to parse request body');
    }

    // Create request context
    const context: RequestContext = {
      requestId,
      startTime,
      provider: '',
      model: (body.model as string) || '',
      configId: c.get('configId'),
      endpoint: path,
      isStreaming,
    };

    c.set('__costTrackingContext', context);

    // Execute the handler
    await next();

    // After handler execution, gather data for logging
    const response = c.res;
    const statusCode = response.status;
    const latencyMs = Date.now() - startTime;

    // Get provider and model from context (set by gateway adapter)
    const variantModel = c.get('variantModel') || context.model;

    // Try to determine provider from portkey config header
    let provider = 'unknown';
    const portkeyConfigHeader = c.req.header('x-portkey-config');
    if (portkeyConfigHeader) {
      try {
        const portkeyConfig = JSON.parse(portkeyConfigHeader);
        provider = portkeyConfig.provider || provider;
      } catch {
        // Ignore parse errors
      }
    }

    // Skip if we couldn't determine basic info
    if (!variantModel) {
      log(`Skipping request tracking - no model info`);
      return;
    }

    // Initialize batch writer lazily
    // Cast db to include batchInsertRequests (added by createLLMRequestsDataLayer)
    const db = c.get('db') as unknown as DbWithBatchInsert;
    const batchWriter = getGlobalBatchWriter(
      { batchInsertRequests: (requests) => db.batchInsertRequests(requests) },
      { flushIntervalMs, debug }
    );

    // Handle streaming vs non-streaming responses
    if (isStreaming && response.body) {
      // Wrap the streaming response to extract usage
      const { response: wrappedResponse, usagePromise } =
        wrapStreamingResponse(response);

      // Replace the response
      c.res = wrappedResponse;

      // Process usage asynchronously after stream completes
      usagePromise
        .then(async (usage) => {
          await processUsageAndLog({
            requestId,
            provider,
            model: variantModel,
            configId: context.configId,
            variantId: c.get('variantId'),
            endpoint: context.endpoint,
            statusCode,
            latencyMs,
            isStreaming: true,
            usage: usage
              ? {
                  promptTokens: usage.promptTokens,
                  completionTokens: usage.completionTokens,
                  totalTokens: usage.totalTokens,
                  cachedTokens: usage.cachedTokens,
                }
              : null,
            batchWriter,
            trackErrors,
            log,
          });
        })
        .catch((err) => {
          logger.error(
            `[CostTracking] Failed to process streaming usage: ${err}`
          );
        });
    } else {
      // Non-streaming: extract usage from response body
      let usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens?: number;
      } | null = null;

      try {
        const clonedResponse = response.clone();
        const responseBody: OpenAIResponse = await clonedResponse.json();

        if (responseBody.usage) {
          usage = {
            promptTokens: responseBody.usage.prompt_tokens || 0,
            completionTokens: responseBody.usage.completion_tokens || 0,
            totalTokens: responseBody.usage.total_tokens || 0,
            cachedTokens:
              responseBody.usage.prompt_tokens_details?.cached_tokens,
          };
        }
      } catch {
        log('Failed to parse response body for usage');
      }

      // Process and log
      await processUsageAndLog({
        requestId,
        provider,
        model: variantModel,
        configId: context.configId,
        variantId: c.get('variantId'),
        endpoint: context.endpoint,
        statusCode,
        latencyMs,
        isStreaming: false,
        usage,
        batchWriter,
        trackErrors,
        log,
      });
    }
  };
}

/**
 * Process usage data and log to batch writer
 */
async function processUsageAndLog(params: {
  requestId: string;
  provider: string;
  model: string;
  configId?: string;
  variantId?: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  isStreaming: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;
  } | null;
  batchWriter: ReturnType<typeof getGlobalBatchWriter>;
  trackErrors: boolean;
  log: (msg: string) => void;
}): Promise<void> {
  const {
    requestId,
    provider,
    model,
    configId,
    variantId,
    endpoint,
    statusCode,
    latencyMs,
    isStreaming,
    usage,
    batchWriter,
    trackErrors,
    log,
  } = params;

  // Skip error responses if not tracking errors
  if (!trackErrors && statusCode >= 400) {
    log(`Skipping error response (${statusCode})`);
    return;
  }

  // Calculate cost if we have usage
  let cost = 0;
  let inputCost = 0;
  let outputCost = 0;

  if (usage && usage.promptTokens + usage.completionTokens > 0) {
    try {
      const pricing = await pricingProvider.getModelPricing(provider, model);

      if (pricing) {
        const costResult = calculateCost(
          {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          },
          pricing
        );
        cost = costResult.totalCost;
        inputCost = costResult.inputCost;
        outputCost = costResult.outputCost;
        log(`Calculated cost: ${cost} micro-dollars for ${provider}/${model}`);
      } else {
        log(`No pricing found for ${provider}/${model}`);
      }
    } catch (err) {
      logger.error(`[CostTracking] Failed to calculate cost: ${err}`);
    }
  }

  // Build request data for logging
  const requestData: LLMRequestData = {
    requestId,
    configId: configId || null,
    variantId: variantId || null,
    provider,
    model,
    promptTokens: usage?.promptTokens || 0,
    completionTokens: usage?.completionTokens || 0,
    totalTokens: usage?.totalTokens || 0,
    cachedTokens: usage?.cachedTokens || 0,
    cost,
    inputCost,
    outputCost,
    endpoint,
    statusCode,
    latencyMs,
    isStreaming,
    tags: {},
  };

  // Enqueue for batch insert
  batchWriter.enqueue(requestData);
  log(`Enqueued request ${requestId} for logging`);
}
