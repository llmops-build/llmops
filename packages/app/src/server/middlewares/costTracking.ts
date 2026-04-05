import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'node:crypto';
import {
  logger,
  LLMOPS_REQUEST_ID_HEADER,
  LLMOPS_TRACE_ID_HEADER,
  LLMOPS_SPAN_ID_HEADER,
  getDefaultPricingProvider,
  calculateCacheAwareCost,
} from '@llmops/core';
import {
  wrapStreamingResponse,
  ensureStreamUsageEnabled,
} from '@server/lib/streamingCostExtractor';
import {
  getGlobalBatchWriter,
  type LLMRequestData,
  type GuardrailResults,
} from '@server/services/batchWriter';
import {
  resolveTraceContext,
  formatTraceparent,
  type TraceContext,
} from '@server/lib/traceContext';
import { getGlobalTraceBatchWriter } from '@server/services/traceBatchWriter';
import type { SpanInsert, SpanEventInsert, TraceUpsert } from '@llmops/sdk';

const pricingProvider = getDefaultPricingProvider();

/**
 * OpenAI-compatible usage structure in response body
 * Supports both chat completions format and responses API format
 */
interface OpenAIUsage {
  // Chat completions format
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
  // Responses API format (OpenAI Agents SDK)
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: {
    cached_tokens?: number;
  };
  output_tokens_details?: {
    reasoning_tokens?: number;
  };
  // Anthropic format
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

/**
 * Gateway guardrail check result from hook execution
 */
interface GatewayGuardrailCheckResult {
  id: string;
  verdict: boolean;
  execution_time: number;
  error?: Error | null;
  data?: unknown;
}

/**
 * Gateway guardrail/hook result structure
 */
interface GatewayHookResult {
  id: string;
  verdict: boolean;
  execution_time: number;
  checks: GatewayGuardrailCheckResult[];
  deny: boolean;
  type: string;
}

/**
 * Gateway hook_results structure returned in response body
 */
interface GatewayHookResults {
  before_request_hooks?: GatewayHookResult[];
  after_request_hooks?: GatewayHookResult[];
}

/**
 * OpenAI-compatible response body with hook results
 */
interface OpenAIResponse {
  usage?: OpenAIUsage;
  hook_results?: GatewayHookResults;
  choices?: Array<{ message?: unknown; text?: string }>;
  output?: unknown;
}

/**
 * Transform gateway hook results to our schema format for telemetry
 */
function transformHookResultsToGuardrailResults(
  hookResults: GatewayHookResults | undefined,
  wasBlocked: boolean,
): GuardrailResults | null {
  if (!hookResults) return null;

  const beforeHooks = hookResults.before_request_hooks || [];
  const afterHooks = hookResults.after_request_hooks || [];

  // If no hooks were executed, return null
  if (beforeHooks.length === 0 && afterHooks.length === 0) {
    return null;
  }

  const results: GuardrailResults['results'] = [];
  let totalLatencyMs = 0;

  // Process before request hooks
  for (const hook of beforeHooks) {
    totalLatencyMs += hook.execution_time;
    for (const check of hook.checks) {
      results.push({
        checkId: check.id, // Guardrail check ID (format: pluginId.functionId)
        functionId: check.id.split('.')[1] || check.id,
        hookType: 'beforeRequestHook',
        verdict: check.verdict,
        latencyMs: check.execution_time,
      });
    }
  }

  // Process after request hooks
  for (const hook of afterHooks) {
    totalLatencyMs += hook.execution_time;
    for (const check of hook.checks) {
      results.push({
        checkId: check.id,
        functionId: check.id.split('.')[1] || check.id,
        hookType: 'afterRequestHook',
        verdict: check.verdict,
        latencyMs: check.execution_time,
      });
    }
  }

  // Determine action based on results
  const anyFailed = results.some((r) => !r.verdict);
  let action: GuardrailResults['action'];
  if (wasBlocked) {
    action = 'blocked';
  } else if (anyFailed) {
    action = 'logged'; // Failed but not blocked (on_fail: 'log')
  } else {
    action = 'allowed';
  }

  return {
    results,
    action,
    totalLatencyMs,
  };
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
    environmentId?: string;
    providerConfigId?: string;
    __costTrackingContext?: RequestContext;
    __traceContext?: TraceContext;
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
    requests: LLMRequestData[],
  ) => Promise<{ count: number }>;
  upsertTrace: (data: TraceUpsert) => Promise<void>;
  batchInsertSpans: (spans: SpanInsert[]) => Promise<{ count: number }>;
  batchInsertSpanEvents: (
    events: SpanEventInsert[],
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
  config: CostTrackingConfig = {},
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

    // Track all model-related endpoints that incur costs
    const path = c.req.path;
    const trackableEndpoints = [
      '/chat/completions',
      '/completions',
      '/responses', // OpenAI Agents SDK
      '/embeddings',
      '/images/generations',
      '/images/edits',
      '/audio/speech',
      '/audio/transcriptions',
      '/audio/translations',
      '/messages', // Anthropic format
    ];

    const shouldTrack = trackableEndpoints.some(
      (endpoint) =>
        path.endsWith(endpoint) ||
        // Handle /responses/:id pattern but not /responses/:id/input_items
        (endpoint === '/responses' && path.match(/\/responses\/[^/]+$/)),
    );

    if (!shouldTrack) {
      return next();
    }

    // Generate request ID for tracing
    const requestId = randomUUID();
    const startTime = Date.now();

    // Set request ID header early
    c.header(LLMOPS_REQUEST_ID_HEADER, requestId);

    // Parse request body to detect streaming and ensure usage is included
    let body: Record<string, unknown> = {};
    let isStreaming = false;

    try {
      const clonedReq = c.req.raw.clone();
      body = await clonedReq.json();
      isStreaming = body.stream === true;

      logger.debug(
        {
          endpoint: path,
          isStreaming,
          streamValue: body.stream,
          model: body.model,
        },
        'Cost tracking: parsed request body',
      );

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

    // Resolve trace context from headers
    const traceContext = resolveTraceContext(c.req);
    c.set('__traceContext', traceContext);

    // Set trace response headers
    c.header(LLMOPS_TRACE_ID_HEADER, traceContext.traceId);
    c.header(LLMOPS_SPAN_ID_HEADER, traceContext.spanId);
    c.header(
      'traceparent',
      formatTraceparent(traceContext.traceId, traceContext.spanId),
    );

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

    // Try to determine provider from llmops config header
    let provider = 'unknown';
    const llmopsConfigHeader =
      c.req.header('x-llmops-config') || c.req.header('x-llmops-prompt');
    if (llmopsConfigHeader) {
      try {
        const llmopsConfig = JSON.parse(llmopsConfigHeader);
        provider = llmopsConfig.provider || provider;
      } catch {
        // Ignore parse errors
      }
    }

    // Extract input from request body (messages for chat, prompt for completions, input for embeddings)
    const requestInput: unknown =
      body.messages ?? body.prompt ?? body.input ?? null;

    // Extract metadata from request body for custom tags
    // OpenAI SDK supports metadata: Record<string, string> (up to 16 key-value pairs)
    let customTags: Record<string, string> = {};
    if (body.metadata && typeof body.metadata === 'object') {
      customTags = Object.fromEntries(
        Object.entries(body.metadata as Record<string, unknown>).filter(
          ([k, v]) => typeof k === 'string' && typeof v === 'string',
        ),
      ) as Record<string, string>;
    }

    // Skip if we couldn't determine basic info
    if (!variantModel) {
      log(`Skipping request tracking - no model info`);
      return;
    }

    // Skip cost tracking if no telemetry store configured
    const db = c.get('telemetryStore') as unknown as DbWithBatchInsert | null;
    if (!db) {
      log(`Skipping cost tracking - no telemetry store configured`);
      return;
    }

    // Initialize batch writers lazily
    // Cast db to include batchInsertRequests (added by createLLMRequestsDataLayer)
    const batchWriter = getGlobalBatchWriter(
      { batchInsertRequests: (requests) => db.batchInsertRequests(requests) },
      { flushIntervalMs, debug },
    );

    const traceBatchWriter = getGlobalTraceBatchWriter(
      {
        upsertTrace: (data) => db.upsertTrace(data),
        batchInsertSpans: (spans) => db.batchInsertSpans(spans),
        batchInsertSpanEvents: (events) => db.batchInsertSpanEvents(events),
      },
      { flushIntervalMs, debug },
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
          // For streaming, guardrail results are sent as SSE events
          // The wrapStreamingResponse extracts hook_results if present
          const guardrailResults = usage?.hookResults
            ? transformHookResultsToGuardrailResults(
                usage.hookResults,
                statusCode === 446,
              )
            : null;

          await processUsageAndLog({
            requestId,
            provider,
            model: variantModel,
            configId: c.get('configId'),
            variantId: c.get('variantId'),
            environmentId: c.get('environmentId'),
            providerConfigId: c.get('providerConfigId'),
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
                  cacheCreationTokens: usage.cacheCreationTokens,
                }
              : null,
            guardrailResults,
            tags: customTags,
            input: requestInput,
            output: usage?.output ?? null,
            traceContext,
            batchWriter,
            traceBatchWriter,
            trackErrors,
            log,
          });
        })
        .catch((err) => {
          logger.error(
            `[CostTracking] Failed to process streaming usage: ${err}`,
          );
        });
    } else {
      // Non-streaming: extract usage and hook_results from response body
      let usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens?: number;
        cacheCreationTokens?: number;
      } | null = null;
      let guardrailResults: GuardrailResults | null = null;
      let responseOutput: unknown = null;

      try {
        const clonedResponse = response.clone();
        const responseBody: OpenAIResponse = await clonedResponse.json();

        // Extract output content from response
        if (responseBody.choices?.[0]?.message) {
          responseOutput = responseBody.choices[0].message;
        } else if (responseBody.output) {
          responseOutput = responseBody.output;
        }

        logger.debug(
          {
            endpoint: context.endpoint,
            hasUsage: !!responseBody.usage,
            rawUsage: responseBody.usage,
          },
          'Cost tracking: parsing response body',
        );

        if (responseBody.usage) {
          // Handle both chat completions format and responses API format
          const promptTokens =
            responseBody.usage.prompt_tokens ??
            responseBody.usage.input_tokens ??
            0;
          const completionTokens =
            responseBody.usage.completion_tokens ??
            responseBody.usage.output_tokens ??
            0;
          usage = {
            promptTokens,
            completionTokens,
            totalTokens:
              responseBody.usage.total_tokens ||
              promptTokens + completionTokens,
            cachedTokens:
              responseBody.usage.prompt_tokens_details?.cached_tokens ??
              responseBody.usage.input_tokens_details?.cached_tokens ??
              responseBody.usage.cache_read_input_tokens,
            cacheCreationTokens: responseBody.usage.cache_creation_input_tokens,
          };
          logger.debug(
            { endpoint: context.endpoint, usage },
            'Cost tracking: extracted usage',
          );
        } else {
          logger.debug(
            { endpoint: context.endpoint },
            'Cost tracking: no usage in response body',
          );
        }

        // Extract guardrail results from hook_results
        if (responseBody.hook_results) {
          // Check if request was blocked (status 446 indicates guardrail failure)
          const wasBlocked = statusCode === 446;
          guardrailResults = transformHookResultsToGuardrailResults(
            responseBody.hook_results,
            wasBlocked,
          );
          if (guardrailResults) {
            log(
              `Extracted guardrail results: ${guardrailResults.results.length} checks, action=${guardrailResults.action}`,
            );
          }
        }
      } catch (error) {
        logger.error(
          { endpoint: context.endpoint, error },
          'Cost tracking: failed to parse response body for usage',
        );
      }

      // Process and log
      await processUsageAndLog({
        requestId,
        provider,
        model: variantModel,
        configId: c.get('configId'),
        variantId: c.get('variantId'),
        environmentId: c.get('environmentId'),
        providerConfigId: c.get('providerConfigId'),
        endpoint: context.endpoint,
        statusCode,
        latencyMs,
        isStreaming: false,
        usage,
        guardrailResults,
        tags: customTags,
        input: requestInput,
        output: responseOutput,
        traceContext,
        batchWriter,
        traceBatchWriter,
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
  environmentId?: string;
  providerConfigId?: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  isStreaming: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;
    cacheCreationTokens?: number;
  } | null;
  guardrailResults?: GuardrailResults | null;
  tags?: Record<string, string>;
  input?: unknown;
  output?: unknown;
  traceContext?: TraceContext;
  batchWriter: ReturnType<typeof getGlobalBatchWriter>;
  traceBatchWriter?: ReturnType<typeof getGlobalTraceBatchWriter>;
  trackErrors: boolean;
  log: (msg: string) => void;
}): Promise<void> {
  const {
    requestId,
    provider,
    model,
    configId,
    variantId,
    environmentId,
    providerConfigId,
    endpoint,
    statusCode,
    latencyMs,
    isStreaming,
    usage,
    guardrailResults,
    tags = {},
    input,
    output,
    traceContext,
    batchWriter,
    traceBatchWriter,
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
  let cacheSavings = 0;

  if (usage && usage.promptTokens + usage.completionTokens > 0) {
    try {
      const pricing = await pricingProvider.getModelPricing(provider, model);

      if (pricing) {
        const costResult = calculateCacheAwareCost(
          {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            cachedTokens: usage.cachedTokens,
            cacheCreationTokens: usage.cacheCreationTokens,
          },
          pricing,
          provider,
        );
        cost = costResult.totalCost;
        inputCost = costResult.inputCost;
        outputCost = costResult.outputCost;
        cacheSavings = costResult.cacheSavings;
        log(`Calculated cost: ${cost} micro-dollars for ${provider}/${model}`);
      } else {
        log(`No pricing found for ${provider}/${model}`);
      }
    } catch (err) {
      logger.error(`[CostTracking] Failed to calculate cost: ${err}`);
    }
  }

  // Validate UUID fields before logging
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-fA-F]{12}$/i;

  const validateUUID = (
    value: string | null,
    fieldName: string,
  ): string | null => {
    if (!value) return null;
    if (!UUID_REGEX.test(value)) {
      log(`Invalid ${fieldName} format: ${value}. Expected UUID or null.`);
      return null;
    }
    return value;
  };

  const validConfigId = validateUUID(configId || null, 'configId');
  const validVariantId = validateUUID(variantId || null, 'variantId');
  const validEnvironmentId = validateUUID(
    environmentId || null,
    'environmentId',
  );
  const validProviderConfigId = validateUUID(
    providerConfigId || null,
    'providerConfigId',
  );

  // Build request data for logging
  const requestData: LLMRequestData = {
    requestId,
    configId: validConfigId,
    variantId: validVariantId,
    environmentId: validEnvironmentId,
    providerConfigId: validProviderConfigId,
    provider,
    model,
    promptTokens: usage?.promptTokens || 0,
    completionTokens: usage?.completionTokens || 0,
    totalTokens: usage?.totalTokens || 0,
    cachedTokens: usage?.cachedTokens || 0,
    cacheCreationTokens: usage?.cacheCreationTokens || 0,
    cost,
    cacheSavings,
    inputCost,
    outputCost,
    endpoint,
    statusCode,
    latencyMs,
    isStreaming,
    tags,
    guardrailResults: guardrailResults || null,
    traceId: traceContext?.traceId ?? null,
    spanId: traceContext?.spanId ?? null,
    parentSpanId: traceContext?.parentSpanId ?? null,
    sessionId: traceContext?.sessionId ?? null,
  };

  // Enqueue for batch insert
  batchWriter.enqueue(requestData);
  log(`Enqueued request ${requestId} for logging`);

  // In edge runtimes, await flush to ensure data is written before Worker exits
  const isEdge = typeof globalThis.process === 'undefined' || !globalThis.process?.versions?.node;
  if (isEdge) {
    await batchWriter.flush();
  }

  // Enqueue trace data if trace batch writer is available
  if (traceBatchWriter && traceContext) {
    const now = new Date();
    const startTimeDate = new Date(now.getTime() - latencyMs);

    const spanStatus = statusCode >= 400 ? 2 : 1; // ERROR=2, OK=1
    const traceStatus = statusCode >= 400 ? 'error' : 'ok';

    const spanData: SpanInsert = {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      parentSpanId: traceContext.parentSpanId,
      name:
        traceContext.spanName ||
        `${provider}/${model} ${endpoint.split('/').pop()}`,
      kind: 2, // SERVER
      status: spanStatus,
      statusMessage: statusCode >= 400 ? `HTTP ${statusCode}` : null,
      startTime: startTimeDate,
      endTime: now,
      durationMs: latencyMs,
      provider,
      model,
      promptTokens: usage?.promptTokens || 0,
      completionTokens: usage?.completionTokens || 0,
      totalTokens: usage?.totalTokens || 0,
      cost,
      configId: validConfigId,
      variantId: validVariantId,
      environmentId: validEnvironmentId,
      providerConfigId: validProviderConfigId,
      requestId,
      source: 'gateway',
      input: input ?? null,
      output: output ?? null,
      attributes: {
        'gen_ai.operation.name': endpoint.includes('chat')
          ? 'chat'
          : endpoint.includes('embeddings')
            ? 'embeddings'
            : 'text_completion',
        'gen_ai.provider.name': provider,
        'gen_ai.request.model': model,
        'gen_ai.usage.input_tokens': usage?.promptTokens || 0,
        'gen_ai.usage.output_tokens': usage?.completionTokens || 0,
        'llmops.request.id': requestId,
        'llmops.cost.total': cost,
        'llmops.cost.input': inputCost,
        'llmops.cost.output': outputCost,
        'llmops.is_streaming': isStreaming,
        ...(validConfigId ? { 'llmops.config.id': validConfigId } : {}),
        ...(validVariantId ? { 'llmops.variant.id': validVariantId } : {}),
        ...(validEnvironmentId
          ? { 'llmops.environment.id': validEnvironmentId }
          : {}),
        ...(validProviderConfigId
          ? { 'llmops.provider_config.id': validProviderConfigId }
          : {}),
        ...(usage?.cachedTokens
          ? { 'llmops.cached_tokens': usage.cachedTokens }
          : {}),
        ...(guardrailResults
          ? {
              'llmops.guardrail.action': guardrailResults.action,
              'llmops.guardrail.latency_ms': guardrailResults.totalLatencyMs,
            }
          : {}),
      },
    };

    const traceData: TraceUpsert = {
      traceId: traceContext.traceId,
      name: traceContext.traceName || `${provider}/${model}`,
      sessionId: traceContext.sessionId,
      userId: traceContext.userId,
      status: traceStatus as 'unset' | 'ok' | 'error',
      startTime: startTimeDate,
      endTime: now,
      durationMs: latencyMs,
      spanCount: 1,
      totalInputTokens: usage?.promptTokens || 0,
      totalOutputTokens: usage?.completionTokens || 0,
      totalTokens: usage?.totalTokens || 0,
      totalCost: cost,
      tags,
      metadata: {},
    };

    traceBatchWriter.enqueue({
      span: spanData,
      trace: traceData,
    });
    log(
      `Enqueued trace span ${traceContext.spanId} for trace ${traceContext.traceId}`,
    );

    if (isEdge) {
      await traceBatchWriter.flush();
    }
  }
}
