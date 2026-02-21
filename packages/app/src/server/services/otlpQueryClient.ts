import { logger } from '@llmops/core';
import type { OtlpConfig } from '@llmops/core';

/**
 * OTLP Query Client
 *
 * Queries traces from a Tempo-compatible HTTP API.
 * Most OTLP backends (Tempo, SigNoz, Uptrace) expose:
 *   GET /api/search          — list/search traces
 *   GET /api/traces/{traceID} — get a single trace (OTLP JSON)
 */

// ---------- Response shapes from Tempo HTTP API ----------

interface TempoSearchTrace {
  traceID: string;
  rootServiceName?: string;
  rootTraceName?: string;
  startTimeUnixNano: string;
  durationMs?: number;
  spanSets?: Array<{
    spans?: Array<{
      spanID: string;
      startTimeUnixNano: string;
      durationNanos: string;
      attributes?: Array<{ key: string; value: { stringValue?: string } }>;
    }>;
    matched?: number;
  }>;
  spanSet?: {
    spans?: Array<{
      spanID: string;
      startTimeUnixNano: string;
      durationNanos: string;
      attributes?: Array<{ key: string; value: { stringValue?: string } }>;
    }>;
    matched?: number;
  };
  serviceStats?: Record<string, { spanCount: number }>;
}

interface TempoSearchResponse {
  traces: TempoSearchTrace[];
  metrics?: {
    totalBlocks?: number;
    totalBlockBytes?: number;
    completedJobs?: number;
    totalJobs?: number;
  };
}

// OTLP JSON trace format (returned by GET /api/traces/{traceID})
interface OtlpAnyValue {
  stringValue?: string;
  intValue?: string | number;
  doubleValue?: number;
  boolValue?: boolean;
  arrayValue?: { values?: OtlpAnyValue[] };
}

interface OtlpKeyValue {
  key: string;
  value: OtlpAnyValue;
}

interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: number;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  attributes?: OtlpKeyValue[];
  events?: Array<{
    name: string;
    timeUnixNano: string;
    attributes?: OtlpKeyValue[];
  }>;
  status?: { code?: number; message?: string };
}

interface OtlpTraceResponse {
  batches?: Array<{
    resource?: { attributes?: OtlpKeyValue[] };
    scopeSpans?: Array<{
      scope?: { name?: string };
      spans?: OtlpSpan[];
    }>;
    instrumentationLibrarySpans?: Array<{
      spans?: OtlpSpan[];
    }>;
  }>;
  // Tempo also wraps in resourceSpans
  resourceSpans?: Array<{
    resource?: { attributes?: OtlpKeyValue[] };
    scopeSpans?: Array<{
      scope?: { name?: string };
      spans?: OtlpSpan[];
    }>;
  }>;
}

// ---------- Normalised output shapes (match DB layer) ----------

export interface OtlpTraceRow {
  id: string;
  traceId: string;
  name: string | null;
  sessionId: string | null;
  userId: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  spanCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OtlpSpanRow {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  kind: number;
  status: number;
  statusMessage: string | null;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  provider: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  source: string;
  input: unknown | null;
  output: unknown | null;
  attributes: Record<string, unknown>;
}

export interface OtlpSpanEventRow {
  id: string;
  traceId: string;
  spanId: string;
  name: string;
  timestamp: string;
  attributes: Record<string, unknown>;
}

// ---------- Helpers ----------

function nanoToISOString(nanoStr: string): string {
  const ms = Math.floor(Number(BigInt(nanoStr) / BigInt(1_000_000)));
  return new Date(ms).toISOString();
}

function nanoToMs(nanoStr: string): number {
  return Math.floor(Number(BigInt(nanoStr) / BigInt(1_000_000)));
}

function extractAttr(
  attrs: OtlpKeyValue[] | undefined,
  keys: string[]
): string | number | undefined {
  if (!attrs) return undefined;
  for (const key of keys) {
    const kv = attrs.find((a) => a.key === key);
    if (kv) {
      const v = kv.value;
      if (v.stringValue !== undefined) return v.stringValue;
      if (v.intValue !== undefined) return Number(v.intValue);
      if (v.doubleValue !== undefined) return v.doubleValue;
    }
  }
  return undefined;
}

function attrsToRecord(attrs?: OtlpKeyValue[]): Record<string, unknown> {
  if (!attrs) return {};
  const out: Record<string, unknown> = {};
  for (const kv of attrs) {
    const v = kv.value;
    if (v.stringValue !== undefined) out[kv.key] = v.stringValue;
    else if (v.intValue !== undefined) out[kv.key] = Number(v.intValue);
    else if (v.doubleValue !== undefined) out[kv.key] = v.doubleValue;
    else if (v.boolValue !== undefined) out[kv.key] = v.boolValue;
  }
  return out;
}

function mapOtlpSpanToRow(
  span: OtlpSpan,
  resourceAttrs?: OtlpKeyValue[]
): OtlpSpanRow {
  const allAttrs = [
    ...(resourceAttrs ?? []),
    ...(span.attributes ?? []),
  ];

  const startMs = nanoToMs(span.startTimeUnixNano);
  const endMs = span.endTimeUnixNano
    ? nanoToMs(span.endTimeUnixNano)
    : null;
  const durationMs = endMs !== null ? endMs - startMs : null;

  const provider =
    (extractAttr(allAttrs, [
      'gen_ai.provider.name',
      'gen_ai.system',
      'ai.model.provider',
    ]) as string) ?? null;
  const model =
    (extractAttr(allAttrs, [
      'gen_ai.request.model',
      'ai.model.id',
    ]) as string) ?? null;
  const promptTokens = Number(
    extractAttr(allAttrs, [
      'gen_ai.usage.input_tokens',
      'ai.usage.promptTokens',
    ]) ?? 0
  );
  const completionTokens = Number(
    extractAttr(allAttrs, [
      'gen_ai.usage.output_tokens',
      'ai.usage.completionTokens',
    ]) ?? 0
  );
  const input =
    extractAttr(allAttrs, [
      'ai.prompt.messages',
      'gen_ai.prompt',
      'ai.prompt',
    ]) ?? null;
  const output =
    extractAttr(allAttrs, [
      'ai.response.text',
      'ai.response.object',
      'gen_ai.completion',
      'ai.response.toolCalls',
    ]) ?? null;

  return {
    id: span.spanId,
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId || null,
    name: span.name,
    kind: span.kind ?? 1,
    status: span.status?.code ?? 0,
    statusMessage: span.status?.message ?? null,
    startTime: new Date(startMs).toISOString(),
    endTime: endMs !== null ? new Date(endMs).toISOString() : null,
    durationMs,
    provider,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cost: 0,
    source: 'otlp',
    input,
    output,
    attributes: attrsToRecord(allAttrs),
  };
}

// ---------- Public API ----------

export interface OtlpQueryClient {
  listTraces: (params: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string[]>;
    name?: string;
    status?: string;
    sessionId?: string;
    userId?: string;
  }) => Promise<{
    data: OtlpTraceRow[];
    total: number;
    limit: number;
    offset: number;
  }>;

  getTraceWithSpans: (
    traceId: string
  ) => Promise<
    | {
        trace: OtlpTraceRow;
        spans: OtlpSpanRow[];
        events: OtlpSpanEventRow[];
      }
    | undefined
  >;

  getTraceStats: (params: {
    startDate: Date;
    endDate: Date;
    sessionId?: string;
    userId?: string;
  }) => Promise<{
    totalTraces: number;
    avgDurationMs: number;
    errorCount: number;
    totalCost: number;
    totalTokens: number;
    totalSpans: number;
  }>;
}

export function createOtlpQueryClient(
  otlpConfig: OtlpConfig
): OtlpQueryClient {
  const baseUrl = otlpConfig.endpoint.replace(/\/$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...otlpConfig.headers,
  };

  async function tempoFetch<T>(path: string): Promise<T> {
    const url = `${baseUrl}${path}`;
    logger.info(`[OtlpQuery] GET ${url}`);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `OTLP query failed: ${res.status} ${res.statusText} — ${body}`
      );
    }
    return res.json() as Promise<T>;
  }

  return {
    async listTraces(params) {
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;

      // Build Tempo search query params
      const qs = new URLSearchParams();
      qs.set('limit', String(limit + offset)); // Tempo doesn't support offset natively
      if (params.startDate) {
        qs.set(
          'start',
          String(Math.floor(params.startDate.getTime() / 1000))
        );
      }
      if (params.endDate) {
        qs.set('end', String(Math.floor(params.endDate.getTime() / 1000)));
      }

      // Build TraceQL query fragments for filtering
      const filters: string[] = [];
      if (params.name) {
        filters.push(`name = "${params.name}"`);
      }
      if (params.status) {
        const statusMap: Record<string, string> = {
          ok: 'ok',
          error: 'error',
          unset: 'unset',
        };
        if (statusMap[params.status]) {
          filters.push(`status = ${statusMap[params.status]}`);
        }
      }
      if (params.tags) {
        for (const [key, values] of Object.entries(params.tags)) {
          if (values.length > 0) {
            filters.push(
              `span.${key} = "${values[0]}"`
            );
          }
        }
      }
      if (filters.length > 0) {
        qs.set('q', `{ ${filters.join(' && ')} }`);
      }

      const result = await tempoFetch<TempoSearchResponse>(
        `/api/search?${qs.toString()}`
      );

      const allTraces = (result.traces ?? []).map(
        (t): OtlpTraceRow => {
          const startMs = nanoToMs(t.startTimeUnixNano);
          const durationMs = t.durationMs ?? null;
          const endMs =
            durationMs !== null ? startMs + durationMs : null;

          // Count spans from spanSets
          let spanCount = 0;
          const sets = t.spanSets ?? (t.spanSet ? [t.spanSet] : []);
          for (const ss of sets) {
            spanCount += ss.matched ?? ss.spans?.length ?? 0;
          }
          if (t.serviceStats) {
            spanCount = Object.values(t.serviceStats).reduce(
              (sum, s) => sum + s.spanCount,
              0
            );
          }

          return {
            id: t.traceID,
            traceId: t.traceID,
            name: t.rootTraceName ?? null,
            sessionId: null,
            userId: null,
            status: 'unset',
            startTime: new Date(startMs).toISOString(),
            endTime: endMs !== null ? new Date(endMs).toISOString() : null,
            durationMs,
            spanCount: spanCount || 1,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            totalCost: 0,
            tags: {},
            metadata: {},
            createdAt: new Date(startMs).toISOString(),
            updatedAt: new Date(startMs).toISOString(),
          };
        }
      );

      // Simulate offset since Tempo doesn't support it natively
      const sliced = allTraces.slice(offset, offset + limit);

      return {
        data: sliced,
        total: allTraces.length,
        limit,
        offset,
      };
    },

    async getTraceWithSpans(traceId) {
      let result: OtlpTraceResponse;
      try {
        result = await tempoFetch<OtlpTraceResponse>(
          `/api/traces/${traceId}`
        );
      } catch (e) {
        logger.error(
          `[OtlpQuery] Failed to fetch trace ${traceId}: ${e instanceof Error ? e.message : String(e)}`
        );
        return undefined;
      }

      // Normalise batches/resourceSpans
      const resourceSpansList =
        result.resourceSpans ?? result.batches ?? [];

      const spans: OtlpSpanRow[] = [];
      const events: OtlpSpanEventRow[] = [];

      for (const rs of resourceSpansList) {
        const resourceAttrs = rs.resource?.attributes;
        const scopeSpansList = [
          ...(rs.scopeSpans ?? []),
          ...((rs as Record<string, unknown>)
            .instrumentationLibrarySpans as Array<{
            spans?: OtlpSpan[];
          }>) ?? [],
        ];

        for (const ss of scopeSpansList) {
          for (const otlpSpan of ss.spans ?? []) {
            spans.push(mapOtlpSpanToRow(otlpSpan, resourceAttrs));

            // Map events
            for (const event of otlpSpan.events ?? []) {
              events.push({
                id: `${otlpSpan.spanId}-${event.name}-${event.timeUnixNano}`,
                traceId: otlpSpan.traceId,
                spanId: otlpSpan.spanId,
                name: event.name,
                timestamp: nanoToISOString(event.timeUnixNano),
                attributes: attrsToRecord(event.attributes),
              });
            }
          }
        }
      }

      if (spans.length === 0) return undefined;

      // Build trace row from spans
      const rootSpan = spans.find((s) => !s.parentSpanId) ?? spans[0];
      const startTimes = spans.map((s) => new Date(s.startTime).getTime());
      const endTimes = spans
        .filter((s) => s.endTime)
        .map((s) => new Date(s.endTime!).getTime());
      const traceStart = Math.min(...startTimes);
      const traceEnd = endTimes.length > 0 ? Math.max(...endTimes) : null;

      const totalInputTokens = spans.reduce(
        (sum, s) => sum + s.promptTokens,
        0
      );
      const totalOutputTokens = spans.reduce(
        (sum, s) => sum + s.completionTokens,
        0
      );

      const hasError = spans.some((s) => s.status === 2);
      const hasOk = spans.some((s) => s.status === 1);
      const traceStatus = hasError ? 'error' : hasOk ? 'ok' : 'unset';

      const trace: OtlpTraceRow = {
        id: traceId,
        traceId,
        name: rootSpan.name,
        sessionId: null,
        userId: null,
        status: traceStatus,
        startTime: new Date(traceStart).toISOString(),
        endTime: traceEnd !== null ? new Date(traceEnd).toISOString() : null,
        durationMs: traceEnd !== null ? traceEnd - traceStart : null,
        spanCount: spans.length,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost: 0,
        tags: {},
        metadata: {},
        createdAt: new Date(traceStart).toISOString(),
        updatedAt: new Date(traceStart).toISOString(),
      };

      return { trace, spans, events };
    },

    async getTraceStats(params) {
      // Use the search endpoint to compute stats
      const qs = new URLSearchParams();
      qs.set('start', String(Math.floor(params.startDate.getTime() / 1000)));
      qs.set('end', String(Math.floor(params.endDate.getTime() / 1000)));
      qs.set('limit', '1000');

      const result = await tempoFetch<TempoSearchResponse>(
        `/api/search?${qs.toString()}`
      );

      const traces = result.traces ?? [];
      const totalTraces = traces.length;
      const durations = traces
        .map((t) => t.durationMs)
        .filter((d): d is number => d !== undefined);
      const avgDurationMs =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

      let totalSpans = 0;
      for (const t of traces) {
        if (t.serviceStats) {
          totalSpans += Object.values(t.serviceStats).reduce(
            (sum, s) => sum + s.spanCount,
            0
          );
        } else {
          const sets = t.spanSets ?? (t.spanSet ? [t.spanSet] : []);
          for (const ss of sets) {
            totalSpans += ss.matched ?? ss.spans?.length ?? 0;
          }
        }
      }

      return {
        totalTraces,
        avgDurationMs: Math.round(avgDurationMs),
        errorCount: 0, // Tempo search doesn't expose status in search results
        totalCost: 0,
        totalTokens: 0,
        totalSpans: totalSpans || totalTraces,
      };
    },
  };
}
