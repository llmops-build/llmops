import { Hono } from 'hono';
import {
  logger,
  getDefaultPricingProvider,
  calculateCacheAwareCost,
} from '@llmops/core';
import type { SpanInsert, SpanEventInsert, TraceUpsert } from '@llmops/core';
import {
  getGlobalTraceBatchWriter,
  type TraceQueueItem,
} from '@server/services/traceBatchWriter';
import {
  decodeOtlpProtobuf,
  type OtlpKeyValue,
  type ExportTraceServiceRequest,
} from './decode';

/**
 * Convert nanosecond timestamp string to Date
 */
function nanoToDate(nanoStr: string): Date {
  const ms = Math.floor(Number(BigInt(nanoStr) / BigInt(1_000_000)));
  return new Date(ms);
}

/**
 * Extract a primitive value from an OTLP KeyValue
 */
function extractValue(
  kv: OtlpKeyValue,
): string | number | boolean | string[] | undefined {
  const v = kv.value;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.intValue !== undefined) return Number(v.intValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.boolValue !== undefined) return v.boolValue;
  if (v.arrayValue?.values) {
    return v.arrayValue.values
      .map((item) => item.stringValue)
      .filter((s): s is string => s !== undefined);
  }
  return undefined;
}

/**
 * Convert OTLP attributes array to a flat Record
 */
function attributesToRecord(attrs?: OtlpKeyValue[]): Record<string, unknown> {
  if (!attrs) return {};
  const result: Record<string, unknown> = {};
  for (const kv of attrs) {
    result[kv.key] = extractValue(kv);
  }
  return result;
}

/**
 * Extract known typed fields from attributes
 */
function extractTypedFields(attrs: Record<string, unknown>) {
  const get = (keys: string[]): unknown => {
    for (const key of keys) {
      if (attrs[key] !== undefined) return attrs[key];
    }
    return undefined;
  };

  const provider =
    (get(['gen_ai.provider.name', 'gen_ai.system', 'ai.model.provider']) as
      | string
      | undefined) ?? null;
  const model =
    (get(['gen_ai.request.model', 'ai.model.id']) as string | undefined) ??
    null;
  const promptTokens = Number(
    get(['gen_ai.usage.input_tokens', 'ai.usage.promptTokens']) ?? 0,
  );
  const completionTokens = Number(
    get(['gen_ai.usage.output_tokens', 'ai.usage.completionTokens']) ?? 0,
  );

  // Extract input/output content
  const input =
    get(['ai.prompt.messages', 'gen_ai.prompt', 'ai.prompt']) ?? null;
  const output =
    get([
      'ai.response.text',
      'ai.response.object',
      'gen_ai.completion',
      'ai.response.toolCalls',
    ]) ?? null;

  return {
    provider,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    input,
    output,
  };
}

/**
 * Database interface with trace methods
 */
interface DbWithTraces {
  upsertTrace: (data: TraceUpsert) => Promise<void>;
  batchInsertSpans: (spans: SpanInsert[]) => Promise<{ count: number }>;
  batchInsertSpanEvents: (
    events: SpanEventInsert[],
  ) => Promise<{ count: number }>;
}

const pricingProvider = getDefaultPricingProvider();

/**
 * OTLP ingestion endpoint
 * Accepts OTLP JSON and Protobuf (ExportTraceServiceRequest) formats
 */
const app = new Hono().post('/v1/traces', async (c) => {
  logger.debug(`[OTLP] POST /v1/traces hit — url: ${c.req.url}`);

  // Auth: Bearer token = environment secret
  const authHeader = c.req.header('authorization');
  if (!authHeader) {
    return c.json({ error: 'Authorization header required' }, 401);
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]?.trim()) {
    return c.json({ error: 'Invalid Authorization format' }, 401);
  }

  const envSec = match[1].trim();
  // TODO: Validate envSec against environment_secrets via manifest router
  // Currently auth is implicitly validated when resolving environment context
  c.set('envSec', envSec);

  // Parse body — route by Content-Type (protobuf vs JSON)
  let body: ExportTraceServiceRequest;
  const contentType = c.req.header('content-type') ?? '';
  logger.debug(`[OTLP] Received request — Content-Type: ${contentType}`);
  try {
    if (
      contentType.includes('application/x-protobuf') ||
      contentType.includes('application/protobuf')
    ) {
      const buffer = await c.req.arrayBuffer();
      logger.debug(`[OTLP] Protobuf body size: ${buffer.byteLength} bytes`);
      body = decodeOtlpProtobuf(new Uint8Array(buffer));
    } else {
      body = await c.req.json();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`[OTLP] Failed to parse request body: ${msg}`);
    return c.json({ error: 'Invalid request body' }, 400);
  }

  logger.debug(
    `[OTLP] Parsed body — resourceSpans count: ${body.resourceSpans?.length ?? 0}`,
  );

  if (!body.resourceSpans || !Array.isArray(body.resourceSpans)) {
    return c.json({ error: 'Missing resourceSpans' }, 400);
  }

  const db = c.get('telemetryStore') as unknown as DbWithTraces | null;
  if (!db) {
    return c.json({ error: 'Database not configured' }, 503);
  }

  // Initialize trace batch writer
  const traceBatchWriter = getGlobalTraceBatchWriter({
    upsertTrace: (data) => db.upsertTrace(data),
    batchInsertSpans: (spans) => db.batchInsertSpans(spans),
    batchInsertSpanEvents: (events) => db.batchInsertSpanEvents(events),
  });

  let spanCount = 0;

  try {
    for (const resourceSpan of body.resourceSpans) {
      const resourceAttrs = attributesToRecord(
        resourceSpan.resource?.attributes,
      );

      logger.debug(
        `[OTLP] resourceSpan — scopeSpans count: ${resourceSpan.scopeSpans?.length ?? 0}, resource attrs: ${JSON.stringify(resourceAttrs)}`,
      );

      for (const scopeSpan of resourceSpan.scopeSpans) {
        logger.debug(
          `[OTLP]   scopeSpan — scope: ${scopeSpan.scope?.name ?? '<none>'}, spans count: ${scopeSpan.spans?.length ?? 0}`,
        );

        for (const otlpSpan of scopeSpan.spans) {
          logger.debug(
            `[OTLP]     raw span — traceId: ${otlpSpan.traceId}, spanId: ${otlpSpan.spanId}, parentSpanId: ${otlpSpan.parentSpanId ?? 'null'}, name: ${otlpSpan.name}, startTimeUnixNano: ${otlpSpan.startTimeUnixNano}, endTimeUnixNano: ${otlpSpan.endTimeUnixNano ?? 'null'}`,
          );

          const allAttrs = {
            ...resourceAttrs,
            ...attributesToRecord(otlpSpan.attributes),
          };

          const typed = extractTypedFields(allAttrs);
          const startTime = nanoToDate(otlpSpan.startTimeUnixNano);
          const endTime = otlpSpan.endTimeUnixNano
            ? nanoToDate(otlpSpan.endTimeUnixNano)
            : null;
          const durationMs = endTime
            ? endTime.getTime() - startTime.getTime()
            : null;

          const spanStatus = otlpSpan.status?.code ?? 0;
          const traceStatus =
            spanStatus === 2 ? 'error' : spanStatus === 1 ? 'ok' : 'unset';

          // Calculate cost from pricing if provider and model are available
          let cost = 0;
          if (
            typed.provider &&
            typed.model &&
            (typed.promptTokens > 0 || typed.completionTokens > 0)
          ) {
            try {
              const pricing = await pricingProvider.getModelPricing(
                typed.provider,
                typed.model,
              );
              if (pricing) {
                const costResult = calculateCacheAwareCost(
                  {
                    promptTokens: typed.promptTokens,
                    completionTokens: typed.completionTokens,
                  },
                  pricing,
                  typed.provider,
                );
                cost = costResult.totalCost;
              }
            } catch (e) {
              logger.debug(
                `[OTLP] Failed to calculate cost for ${typed.provider}/${typed.model}: ${e instanceof Error ? e.message : String(e)}`,
              );
            }
          }

          const spanData: SpanInsert = {
            traceId: otlpSpan.traceId,
            spanId: otlpSpan.spanId,
            parentSpanId: otlpSpan.parentSpanId || null,
            name: otlpSpan.name,
            kind: otlpSpan.kind ?? 1,
            status: spanStatus,
            statusMessage: otlpSpan.status?.message ?? null,
            startTime,
            endTime,
            durationMs,
            provider: typed.provider,
            model: typed.model,
            promptTokens: typed.promptTokens,
            completionTokens: typed.completionTokens,
            totalTokens: typed.totalTokens,
            cost,
            source: 'otlp',
            input: typed.input,
            output: typed.output,
            attributes: allAttrs,
          };

          // Convert OTLP events to SpanEventInsert
          const spanEvents: SpanEventInsert[] = (otlpSpan.events ?? []).map(
            (event) => ({
              traceId: otlpSpan.traceId,
              spanId: otlpSpan.spanId,
              name: event.name,
              timestamp: nanoToDate(event.timeUnixNano),
              attributes: attributesToRecord(event.attributes),
            }),
          );

          const traceData: TraceUpsert = {
            traceId: otlpSpan.traceId,
            name: !otlpSpan.parentSpanId ? otlpSpan.name : null,
            sessionId: (allAttrs['gen_ai.conversation.id'] as string) ?? null,
            userId: null,
            status: traceStatus as 'unset' | 'ok' | 'error',
            startTime,
            endTime,
            durationMs,
            spanCount: 1,
            totalInputTokens: typed.promptTokens,
            totalOutputTokens: typed.completionTokens,
            totalTokens: typed.totalTokens,
            totalCost: cost,
            tags: {},
            metadata: {},
          };

          logger.debug(
            `[OTLP]     spanData — traceId: ${spanData.traceId}, spanId: ${spanData.spanId}, parentSpanId: ${spanData.parentSpanId ?? 'null'}, name: ${spanData.name}, source: ${spanData.source}, startTime: ${spanData.startTime.toISOString()}, endTime: ${spanData.endTime?.toISOString() ?? 'null'}, durationMs: ${spanData.durationMs}`,
          );
          logger.debug(
            `[OTLP]     traceData — traceId: ${traceData.traceId}, name: ${traceData.name ?? 'null'}, status: ${traceData.status}, spanCount: ${traceData.spanCount}`,
          );

          const item: TraceQueueItem = {
            span: spanData,
            events: spanEvents.length > 0 ? spanEvents : undefined,
            trace: traceData,
          };

          traceBatchWriter.enqueue(item);
          spanCount++;
        }
      }
    }

    logger.debug(`[OTLP] Enqueued ${spanCount} spans total`);
    return c.json({ partialSuccess: {} });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[OTLP] Failed to process traces: ${msg}`);
    return c.json({ error: 'Failed to process traces' }, 500);
  }
});

export default app;
