/**
 * LangSmith-compatible trace ingestion endpoint.
 *
 * Accepts the LangSmith wire format (POST /runs/batch) and converts
 * runs to LLMOps traces/spans. This allows LangChain's built-in tracing
 * to send all execution data (chains, tools, LLM calls, retrievers)
 * directly to LLMOps.
 *
 * Usage:
 * - TypeScript SDK: llmopsClient.langchainTracer() (routes in-process)
 * - Python / env vars: LANGCHAIN_ENDPOINT=http://localhost:3000/llmops/api/langsmith
 */

import { Hono } from 'hono';
import {
  logger,
  getDefaultPricingProvider,
  calculateCacheAwareCost,
} from '@llmops/core';
import type { SpanInsert, SpanEventInsert, TraceUpsert } from '@llmops/sdk';
import {
  getGlobalTraceBatchWriter,
  type TraceQueueItem,
} from '@server/services/traceBatchWriter';

// ---------------------------------------------------------------------------
// LangSmith run types (structural — no dependency on langsmith package)
// ---------------------------------------------------------------------------

interface RunCreate {
  id: string;
  name: string;
  run_type: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  start_time?: number | string;
  end_time?: number | string;
  error?: string;
  parent_run_id?: string;
  trace_id?: string;
  dotted_order?: string;
  session_name?: string;
  extra?: Record<string, unknown>;
  tags?: string[];
  events?: Record<string, unknown>[];
}

interface RunUpdate {
  id?: string;
  end_time?: number | string;
  outputs?: Record<string, unknown>;
  error?: string;
  events?: Record<string, unknown>[];
  trace_id?: string;
  dotted_order?: string;
  inputs?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// ID conversion utilities
// ---------------------------------------------------------------------------

/** Strip dashes from UUID → 32-char hex */
function uuidToHex(uuid: string): string {
  return uuid.replace(/-/g, '');
}

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

function parseTimestamp(ts: number | string | undefined | null): Date | null {
  if (ts == null) return null;
  if (typeof ts === 'number') return new Date(ts);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Token / model extraction from LangChain metadata
// ---------------------------------------------------------------------------

interface TokenUsage {
  provider: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

function extractTokenUsage(run: RunCreate): TokenUsage {
  const extra = run.extra ?? {};
  const metadata = (extra.metadata as Record<string, unknown>) ?? {};
  const invocationParams =
    (extra.invocation_params as Record<string, unknown>) ?? {};
  const usageMeta = (metadata.usage_metadata as Record<string, unknown>) ?? {};

  const provider = (metadata.ls_provider as string) ?? null;
  const model =
    (metadata.ls_model_name as string) ??
    (invocationParams.model as string) ??
    (invocationParams.model_name as string) ??
    null;

  const promptTokens = Number(usageMeta.input_tokens ?? 0);
  const completionTokens = Number(usageMeta.output_tokens ?? 0);
  const totalTokens = Number(
    usageMeta.total_tokens ?? promptTokens + completionTokens,
  );

  return { provider, model, promptTokens, completionTokens, totalTokens };
}

// ---------------------------------------------------------------------------
// Run → TraceQueueItem conversion
// ---------------------------------------------------------------------------

const pricingProvider = getDefaultPricingProvider();

async function runCreateToQueueItem(run: RunCreate): Promise<TraceQueueItem> {
  const traceId = run.trace_id ? uuidToHex(run.trace_id) : uuidToHex(run.id);

  const spanId = uuidToHex(run.id);
  const parentSpanId = run.parent_run_id ? uuidToHex(run.parent_run_id) : null;

  const startTime = parseTimestamp(run.start_time) ?? new Date();
  const endTime = parseTimestamp(run.end_time);
  const durationMs = endTime ? endTime.getTime() - startTime.getTime() : null;

  const isRootRun = !run.parent_run_id;
  const hasError = !!run.error;
  const spanStatus = hasError ? 2 : endTime ? 1 : 0;
  const traceStatus = hasError ? 'error' : endTime ? 'ok' : 'unset';

  const usage =
    run.run_type === 'llm'
      ? extractTokenUsage(run)
      : {
          provider: null,
          model: null,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        };

  // Calculate cost if we have provider + model + tokens
  let cost = 0;
  if (
    usage.provider &&
    usage.model &&
    (usage.promptTokens > 0 || usage.completionTokens > 0)
  ) {
    try {
      const pricing = await pricingProvider.getModelPricing(
        usage.provider,
        usage.model,
      );
      if (pricing) {
        const costResult = calculateCacheAwareCost(
          {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          },
          pricing,
          usage.provider,
        );
        cost = costResult.totalCost;
      }
    } catch (e) {
      logger.debug(
        `[LangSmith] Failed to calculate cost for ${usage.provider}/${usage.model}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const attributes: Record<string, unknown> = {
    'langsmith.run_type': run.run_type,
  };
  if (run.session_name) attributes['langsmith.session_name'] = run.session_name;
  if (run.tags?.length) attributes['langsmith.tags'] = run.tags;
  if (usage.provider) attributes['gen_ai.provider.name'] = usage.provider;
  if (usage.model) attributes['gen_ai.request.model'] = usage.model;

  const span: SpanInsert = {
    traceId,
    spanId,
    parentSpanId,
    name: run.name,
    kind: 1,
    status: spanStatus,
    statusMessage: run.error ?? null,
    startTime,
    endTime,
    durationMs,
    provider: usage.provider,
    model: usage.model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    cost,
    source: 'langsmith',
    input: run.inputs ?? null,
    output: run.outputs ?? null,
    attributes,
  };

  const spanEvents: SpanEventInsert[] = (run.events ?? []).map((event) => ({
    traceId,
    spanId,
    name: (event.name as string) ?? 'event',
    timestamp: parseTimestamp(event.time as string | number) ?? new Date(),
    attributes: event,
  }));

  const trace: TraceUpsert = {
    traceId,
    name: isRootRun ? run.name : null,
    sessionId: run.session_name ?? null,
    userId: null,
    status: traceStatus as 'unset' | 'ok' | 'error',
    startTime,
    endTime,
    durationMs,
    spanCount: 1,
    totalInputTokens: usage.promptTokens,
    totalOutputTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    totalCost: cost,
    tags: {},
    metadata: {},
  };

  return {
    span,
    events: spanEvents.length > 0 ? spanEvents : undefined,
    trace,
  };
}

function runUpdateToQueueItem(
  update: RunUpdate & { id: string },
): TraceQueueItem | null {
  const traceId = update.trace_id
    ? uuidToHex(update.trace_id)
    : uuidToHex(update.id);

  const spanId = uuidToHex(update.id);
  const endTime = parseTimestamp(update.end_time);
  const hasError = !!update.error;
  const traceStatus = hasError ? 'error' : endTime ? 'ok' : 'unset';
  const spanStatus = hasError ? 2 : endTime ? 1 : 0;

  const span: SpanInsert = {
    traceId,
    spanId,
    parentSpanId: null,
    name: 'patch',
    kind: 1,
    status: spanStatus,
    statusMessage: update.error ?? null,
    startTime: endTime ?? new Date(),
    endTime,
    durationMs: null,
    provider: null,
    model: null,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cost: 0,
    source: 'langsmith',
    input: null,
    output: update.outputs ?? null,
    attributes: {},
  };

  const trace: TraceUpsert = {
    traceId,
    name: null,
    sessionId: null,
    userId: null,
    status: traceStatus as 'unset' | 'ok' | 'error',
    startTime: endTime ?? new Date(),
    endTime,
    durationMs: null,
    spanCount: 0, // Don't double-count for standalone patches
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    tags: {},
    metadata: {},
  };

  return { span, trace };
}

// ---------------------------------------------------------------------------
// Database interface
// ---------------------------------------------------------------------------

interface DbWithTraces {
  upsertTrace: (data: TraceUpsert) => Promise<void>;
  batchInsertSpans: (spans: SpanInsert[]) => Promise<{ count: number }>;
  batchInsertSpanEvents: (
    events: SpanEventInsert[],
  ) => Promise<{ count: number }>;
}

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono()
  /**
   * GET /info
   * LangSmith capability discovery — unauthenticated.
   * Returning use_multipart_endpoint: false forces the SDK to use /runs/batch.
   */
  .get('/info', (c) => {
    return c.json({
      version: '0.1.0',
      batch_ingest_config: {
        use_multipart_endpoint: false,
        size_limit: 100,
        size_limit_bytes: 20_971_520,
      },
      instance_flags: {
        dataset_examples_multipart_enabled: false,
        gzip_body_enabled: false,
      },
    });
  })

  /**
   * POST /runs/batch
   * Main ingestion endpoint.
   * Body: { post: RunCreate[], patch: RunUpdate[] }
   */
  .post('/runs/batch', async (c) => {
    logger.debug('[LangSmith] POST /runs/batch');

    // Auth: x-api-key header
    const apiKey = c.req.header('x-api-key');
    if (!apiKey?.trim()) {
      return c.json({ error: 'x-api-key header required' }, 401);
    }

    const db = c.get('telemetryStore') as unknown as DbWithTraces | null;
    if (!db) {
      return c.json({ error: 'Telemetry store not configured' }, 503);
    }

    let body: { post?: RunCreate[]; patch?: RunUpdate[] };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const traceBatchWriter = getGlobalTraceBatchWriter({
      upsertTrace: (data) => db.upsertTrace(data),
      batchInsertSpans: (spans) => db.batchInsertSpans(spans),
      batchInsertSpanEvents: (events) => db.batchInsertSpanEvents(events),
    });

    let enqueued = 0;

    try {
      for (const run of body.post ?? []) {
        const item = await runCreateToQueueItem(run);
        traceBatchWriter.enqueue(item);
        enqueued++;
      }

      for (const update of body.patch ?? []) {
        if (!update.id) continue;
        const item = runUpdateToQueueItem(update as RunUpdate & { id: string });
        if (item) {
          traceBatchWriter.enqueue(item);
          enqueued++;
        }
      }

      logger.debug(`[LangSmith] Enqueued ${enqueued} items`);
      return c.json({}, 200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[LangSmith] Failed to process batch: ${msg}`);
      return c.json({ error: 'Failed to process batch' }, 500);
    }
  });

export default app;
