import type { TelemetrySink } from '@llmops/core';

export const noopSink: TelemetrySink = {
  emit: () => {},
  flush: async () => {},
};

export interface Observation {
  traceId: string;
  spanId: string;
  complete(result: {
    status: 'success' | 'error';
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    };
    cost?: number;
    latencyMs?: number;
    input?: unknown;
    output?: unknown;
    error?: string;
  }): void;
}

export function observe(
  sink: TelemetrySink,
  params: {
    provider: string;
    model: string;
    traceId?: string;
    tags?: Record<string, string>;
  },
): Observation {
  const requestId = crypto.randomUUID();
  const spanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const traceId = params.traceId ?? crypto.randomUUID().replace(/-/g, '');
  const startedAt = new Date().toISOString();

  return {
    traceId,
    spanId,
    complete(result) {
      sink.emit([
        {
          type: 'llm_request',
          request: {
            requestId,
            traceId,
            spanId,
            provider: params.provider,
            model: params.model,
            input: result.input,
            output: result.output,
            usage: result.usage,
            cost: result.cost,
            latencyMs: result.latencyMs,
            status: result.status,
            error: result.error,
            tags: params.tags,
            startedAt,
          },
        },
      ]);
    },
  };
}