import { logger } from '@llmops/core';

/**
 * LLM Request data for batch insertion
 * Mirrors the schema from @llmops/core datalayer
 */
export interface LLMRequestData {
  requestId: string;
  configId?: string | null;
  variantId?: string | null;
  environmentId?: string | null;
  providerConfigId?: string | null;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  cost?: number;
  inputCost?: number;
  outputCost?: number;
  endpoint: string;
  statusCode: number;
  latencyMs?: number;
  isStreaming?: boolean;
  userId?: string | null;
  tags?: Record<string, string>;
}

/**
 * BatchWriter service for efficient database writes
 *
 * Buffers LLM request logs in memory and periodically flushes them to the database.
 * This reduces database write load and improves performance for high-throughput scenarios.
 *
 * Inspired by LiteLLM's batch logging approach.
 */
export interface BatchWriterConfig {
  /** Flush interval in milliseconds (default: 2000ms) */
  flushIntervalMs?: number;
  /** Maximum batch size before forced flush (default: 100) */
  maxBatchSize?: number;
  /** Whether to log flush operations (default: false) */
  debug?: boolean;
}

export interface BatchWriterDeps {
  /** Database batch insert function */
  batchInsertRequests: (
    requests: LLMRequestData[]
  ) => Promise<{ count: number }>;
}

export interface BatchWriter {
  /** Add a request to the batch queue */
  enqueue(request: LLMRequestData): void;
  /** Force an immediate flush of all queued requests */
  flush(): Promise<void>;
  /** Stop the batch writer and flush remaining items */
  stop(): Promise<void>;
  /** Get current queue length */
  queueLength(): number;
  /** Check if the writer is running */
  isRunning(): boolean;
}

/**
 * Creates a BatchWriter instance
 *
 * @example
 * ```typescript
 * const writer = createBatchWriter(
 *   { batchInsertRequests: db.batchInsertRequests },
 *   { flushIntervalMs: 2000 }
 * );
 *
 * // Enqueue a request
 * writer.enqueue({
 *   requestId: 'req-123',
 *   provider: 'openai',
 *   model: 'gpt-4o',
 *   // ... other fields
 * });
 *
 * // When shutting down
 * await writer.stop();
 * ```
 */
export function createBatchWriter(
  deps: BatchWriterDeps,
  config: BatchWriterConfig = {}
): BatchWriter {
  const { flushIntervalMs = 2000, maxBatchSize = 100, debug = false } = config;

  let queue: LLMRequestData[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let running = false;
  let flushing = false;

  const log = debug ? (msg: string) => logger.debug(msg) : () => {};

  /**
   * Flush all queued requests to the database
   */
  async function flush(): Promise<void> {
    if (flushing || queue.length === 0) {
      return;
    }

    flushing = true;
    const batch = queue;
    queue = [];

    try {
      log(`[BatchWriter] Flushing ${batch.length} requests`);
      const result = await deps.batchInsertRequests(batch);
      log(`[BatchWriter] Flushed ${result.count} requests successfully`);
    } catch (error) {
      // On error, re-queue the failed batch at the front
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `[BatchWriter] Flush failed, re-queuing requests: ${errorMsg}`
      );
      queue = [...batch, ...queue];
    } finally {
      flushing = false;
    }
  }

  /**
   * Start the periodic flush timer
   */
  function start(): void {
    if (running) return;
    running = true;

    flushTimer = setInterval(() => {
      flush().catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[BatchWriter] Periodic flush error: ${errorMsg}`);
      });
    }, flushIntervalMs);

    log(`[BatchWriter] Started with ${flushIntervalMs}ms flush interval`);
  }

  /**
   * Stop the batch writer and flush remaining items
   */
  async function stop(): Promise<void> {
    if (!running) return;
    running = false;

    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }

    // Final flush
    await flush();
    log('[BatchWriter] Stopped');
  }

  /**
   * Add a request to the batch queue
   */
  function enqueue(request: LLMRequestData): void {
    queue.push(request);
    log(
      `[BatchWriter] Enqueued request ${request.requestId}, queue size: ${queue.length}`
    );

    // Auto-start on first enqueue
    if (!running) {
      start();
    }

    // Force flush if batch is full
    if (queue.length >= maxBatchSize) {
      log(`[BatchWriter] Max batch size reached, forcing flush`);
      flush().catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[BatchWriter] Forced flush error: ${errorMsg}`);
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
 * Lazily initialized when first accessed
 */
let globalWriter: BatchWriter | null = null;

/**
 * Get or create the global BatchWriter instance
 *
 * @param deps - Database dependencies (required on first call)
 * @param config - Optional configuration
 * @returns The global BatchWriter instance
 */
export function getGlobalBatchWriter(
  deps?: BatchWriterDeps,
  config?: BatchWriterConfig
): BatchWriter {
  if (!globalWriter) {
    if (!deps) {
      throw new Error(
        'BatchWriter dependencies required on first initialization'
      );
    }
    globalWriter = createBatchWriter(deps, config);
  }
  return globalWriter;
}

/**
 * Reset the global BatchWriter (useful for testing)
 */
export async function resetGlobalBatchWriter(): Promise<void> {
  if (globalWriter) {
    await globalWriter.stop();
    globalWriter = null;
  }
}
