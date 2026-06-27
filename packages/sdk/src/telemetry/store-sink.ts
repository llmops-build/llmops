import type {
  TelemetrySink,
  TelemetryEvent,
  LLMRequestRecord,
  SpanRecord,
  TraceRecord,
} from '@llmops/core';
import { dollarsToMicroDollars } from '@llmops/core';
import type { LLMRequestInsert, SpanInsert, TraceUpsert } from './types';
import type { TelemetryStore } from './interface';

export interface StoreSinkConfig {
  flushIntervalMs?: number;
  maxBatchSize?: number;
}

export type StoreSink = TelemetrySink;

export function createStoreSink(
  store: TelemetryStore,
  config: StoreSinkConfig = {},
): StoreSink {
  const { flushIntervalMs = 2000, maxBatchSize = 100 } = config;

  let queue: TelemetryEvent[] = [];
  let started = false;

  function ensureStarted(): void {
    if (started) return;
    started = true;
    setInterval(() => {
      flush().catch(() => {});
    }, flushIntervalMs);
  }

  async function flush(): Promise<void> {
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];

    const requests: LLMRequestInsert[] = [];
    const spans: SpanInsert[] = [];
    const traces: TraceUpsert[] = [];

    for (const event of batch) {
      if (event.type === 'llm_request') {
        requests.push(convertRequest(event.request));
      } else {
        spans.push(convertSpan(event.span));
        if (event.trace) {
          traces.push(convertTrace(event.trace));
        }
      }
    }

    const tasks: Promise<unknown>[] = [];
    if (requests.length > 0) tasks.push(store.batchInsertRequests(requests));
    if (spans.length > 0) tasks.push(store.batchInsertSpans(spans));
    for (const trace of traces) tasks.push(store.upsertTrace(trace));

    await Promise.allSettled(tasks);
  }

  function emit(events: TelemetryEvent[]): void {
    queue.push(...events);
    ensureStarted();
    if (queue.length >= maxBatchSize) {
      flush().catch(() => {});
    }
  }

  return { emit, flush };
}

function convertRequest(r: LLMRequestRecord): LLMRequestInsert {
  const promptTokens = r.usage?.inputTokens ?? 0;
  const completionTokens = r.usage?.outputTokens ?? 0;
  return {
    requestId: r.requestId,
    provider: r.provider,
    model: r.model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cachedTokens: r.usage?.cacheReadTokens ?? 0,
    cacheCreationTokens: r.usage?.cacheWriteTokens ?? 0,
    cost: r.cost != null ? dollarsToMicroDollars(r.cost) : 0,
    cacheSavings: 0,
    inputCost: 0,
    outputCost: 0,
    endpoint: '/chat/completions',
    statusCode: r.status === 'error' ? 500 : 200,
    latencyMs: r.latencyMs ?? 0,
    isStreaming: false,
    tags: r.tags ?? {},
    traceId: r.traceId ?? null,
    spanId: r.spanId ?? null,
  };
}

const KIND_MAP: Record<string, number> = {
  unspecified: 0,
  internal: 1,
  llm: 1,
  chain: 1,
  agent: 1,
  server: 2,
  tool: 3,
  client: 3,
  retrieval: 3,
  producer: 4,
  consumer: 5,
};

function convertSpan(span: SpanRecord): SpanInsert {
  const startTime = new Date(span.startedAt);
  const endTime = span.endedAt ? new Date(span.endedAt) : null;
  const durationMs =
    endTime != null ? endTime.getTime() - startTime.getTime() : null;
  const promptTokens = span.usage?.inputTokens ?? 0;
  const completionTokens = span.usage?.outputTokens ?? 0;

  return {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId ?? null,
    name: span.name,
    kind: span.kind ? (KIND_MAP[span.kind] ?? 1) : 1,
    status: span.status === 'error' ? 2 : 1,
    statusMessage: span.error ?? null,
    startTime,
    endTime,
    durationMs,
    provider:
      (span.attributes?.['gen_ai.provider.name'] as string) ?? null,
    model: (span.attributes?.['gen_ai.request.model'] as string) ?? null,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cost: span.cost != null ? dollarsToMicroDollars(span.cost) : 0,
    source: 'gateway',
    input: span.input ?? null,
    output: span.output ?? null,
    attributes: span.attributes ?? {},
  };
}

function convertTrace(trace: TraceRecord): TraceUpsert {
  const startTime = new Date(trace.startedAt);
  const endTime = trace.endedAt ? new Date(trace.endedAt) : null;
  const durationMs =
    endTime != null ? endTime.getTime() - startTime.getTime() : null;

  return {
    traceId: trace.traceId,
    name: trace.name,
    sessionId: trace.sessionId ?? null,
    userId: trace.userId ?? null,
    status: trace.status ?? 'unset',
    startTime,
    endTime,
    durationMs,
    spanCount: 1,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    tags: {},
    metadata: trace.metadata ?? {},
  };
}