import { logger } from '@llmops/core';
import type { SpanInsert, SpanEventInsert, TraceUpsert } from '@llmops/core';

/**
 * A queued trace item contains span data plus optional events and trace-level info
 */
export interface TraceQueueItem {
  span: SpanInsert;
  events?: SpanEventInsert[];
  trace: TraceUpsert;
}

export interface TraceBatchWriterDeps {
  upsertTrace: (data: TraceUpsert) => Promise<void>;
  batchInsertSpans: (spans: SpanInsert[]) => Promise<{ count: number }>;
  batchInsertSpanEvents: (
    events: SpanEventInsert[]
  ) => Promise<{ count: number }>;
}

export interface TraceBatchWriterConfig {
  flushIntervalMs?: number;
  maxBatchSize?: number;
  debug?: boolean;
}

export interface TraceBatchWriter {
  enqueue(item: TraceQueueItem): void;
  flush(): Promise<void>;
  stop(): Promise<void>;
  queueLength(): number;
  isRunning(): boolean;
}

export function createTraceBatchWriter(
  deps: TraceBatchWriterDeps,
  config: TraceBatchWriterConfig = {}
): TraceBatchWriter {
  const { flushIntervalMs = 2000, maxBatchSize = 100, debug = false } = config;

  let queue: TraceQueueItem[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let running = false;
  let flushing = false;

  const log = debug ? (msg: string) => logger.debug(msg) : () => {};

  async function flush(): Promise<void> {
    if (flushing || queue.length === 0) return;

    flushing = true;
    const batch = queue;
    queue = [];

    try {
      log(`[TraceBatchWriter] Flushing ${batch.length} items`);

      // Group by traceId and upsert each trace
      const traceMap = new Map<string, TraceUpsert>();
      for (const item of batch) {
        // Merge trace upserts: accumulate spans, tokens, cost
        const existing = traceMap.get(item.trace.traceId);
        if (existing) {
          existing.spanCount = (existing.spanCount ?? 0) + (item.trace.spanCount ?? 1);
          existing.totalInputTokens =
            (existing.totalInputTokens ?? 0) + (item.trace.totalInputTokens ?? 0);
          existing.totalOutputTokens =
            (existing.totalOutputTokens ?? 0) + (item.trace.totalOutputTokens ?? 0);
          existing.totalTokens =
            (existing.totalTokens ?? 0) + (item.trace.totalTokens ?? 0);
          existing.totalCost =
            (existing.totalCost ?? 0) + (item.trace.totalCost ?? 0);
          // Use earliest start, latest end
          if (item.trace.startTime < existing.startTime) {
            existing.startTime = item.trace.startTime;
          }
          if (
            item.trace.endTime &&
            (!existing.endTime || item.trace.endTime > existing.endTime)
          ) {
            existing.endTime = item.trace.endTime;
          }
          // Escalate status: error > ok > unset
          if (item.trace.status === 'error') {
            existing.status = 'error';
          } else if (
            item.trace.status === 'ok' &&
            existing.status !== 'error'
          ) {
            existing.status = 'ok';
          }
          // Merge name, sessionId, userId (prefer non-null)
          existing.name = existing.name ?? item.trace.name;
          existing.sessionId = existing.sessionId ?? item.trace.sessionId;
          existing.userId = existing.userId ?? item.trace.userId;
          // Merge tags
          existing.tags = { ...existing.tags, ...item.trace.tags };
          existing.metadata = { ...existing.metadata, ...item.trace.metadata };
        } else {
          traceMap.set(item.trace.traceId, { ...item.trace });
        }
      }

      // Recompute durationMs for merged traces
      for (const trace of traceMap.values()) {
        if (trace.endTime) {
          trace.durationMs =
            trace.endTime.getTime() - trace.startTime.getTime();
        }
      }

      // Upsert all traces
      for (const trace of traceMap.values()) {
        await deps.upsertTrace(trace);
      }

      // Batch insert all spans
      const allSpans = batch.map((item) => item.span);
      if (allSpans.length > 0) {
        await deps.batchInsertSpans(allSpans);
      }

      // Batch insert all events
      const allEvents = batch.flatMap((item) => item.events ?? []);
      if (allEvents.length > 0) {
        await deps.batchInsertSpanEvents(allEvents);
      }

      log(
        `[TraceBatchWriter] Flushed ${traceMap.size} traces, ${allSpans.length} spans, ${allEvents.length} events`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `[TraceBatchWriter] Flush failed, re-queuing items: ${errorMsg}`
      );
      queue = [...batch, ...queue];
    } finally {
      flushing = false;
    }
  }

  function start(): void {
    if (running) return;
    running = true;

    flushTimer = setInterval(() => {
      flush().catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[TraceBatchWriter] Periodic flush error: ${errorMsg}`);
      });
    }, flushIntervalMs);

    log(`[TraceBatchWriter] Started with ${flushIntervalMs}ms flush interval`);
  }

  async function stop(): Promise<void> {
    if (!running) return;
    running = false;

    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }

    await flush();
    log('[TraceBatchWriter] Stopped');
  }

  function enqueue(item: TraceQueueItem): void {
    queue.push(item);
    log(
      `[TraceBatchWriter] Enqueued span ${item.span.spanId}, queue size: ${queue.length}`
    );

    if (!running) {
      start();
    }

    if (queue.length >= maxBatchSize) {
      log(`[TraceBatchWriter] Max batch size reached, forcing flush`);
      flush().catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[TraceBatchWriter] Forced flush error: ${errorMsg}`);
      });
    }
  }

  return {
    enqueue,
    flush,
    stop,
    queueLength: () => queue.length,
    isRunning: () => running,
  };
}

/**
 * Global singleton instance
 */
let globalWriter: TraceBatchWriter | null = null;

export function getGlobalTraceBatchWriter(
  deps?: TraceBatchWriterDeps,
  config?: TraceBatchWriterConfig
): TraceBatchWriter {
  if (!globalWriter) {
    if (!deps) {
      throw new Error(
        'TraceBatchWriter dependencies required on first initialization'
      );
    }
    globalWriter = createTraceBatchWriter(deps, config);
  }
  return globalWriter;
}

export async function resetGlobalTraceBatchWriter(): Promise<void> {
  if (globalWriter) {
    await globalWriter.stop();
    globalWriter = null;
  }
}
