import { describe, expect, it, vi } from 'vitest';
import type { TelemetryStore } from './interface';
import { createStoreSink } from './store-sink';
import type { LLMRequestInsert, SpanInsert, TraceUpsert } from './types';

describe('createStoreSink', () => {
  it('preserves the streaming flag on LLM request records', async () => {
    const batchInsertRequests = vi.fn(
      async (_requests: LLMRequestInsert[]) => ({ count: 1 }),
    );
    const store = {
      batchInsertRequests,
      batchInsertSpans: vi.fn(async () => ({ count: 0 })),
      upsertTrace: vi.fn(async () => null),
    } as unknown as TelemetryStore;
    const sink = createStoreSink(store);

    sink.emit([
      {
        type: 'llm_request',
        request: {
          requestId: crypto.randomUUID(),
          provider: 'openai',
          model: 'gpt-4o-mini',
          input: {},
          output: null,
          isStreaming: true,
          status: 'success',
          startedAt: new Date().toISOString(),
        },
      },
    ]);
    await sink.flush();

    expect(batchInsertRequests).toHaveBeenCalledOnce();
    expect(batchInsertRequests.mock.calls[0]?.[0][0]?.isStreaming).toBe(true);
  });

  it('preserves the gateway endpoint on LLM request records', async () => {
    const batchInsertRequests = vi.fn(
      async (_requests: LLMRequestInsert[]) => ({ count: 1 }),
    );
    const store = {
      batchInsertRequests,
      batchInsertSpans: vi.fn(async () => ({ count: 0 })),
      upsertTrace: vi.fn(async () => null),
    } as unknown as TelemetryStore;
    const sink = createStoreSink(store);

    sink.emit([
      {
        type: 'llm_request',
        request: {
          requestId: crypto.randomUUID(),
          provider: 'google',
          model: 'gemini-2.5-flash-image',
          input: {},
          output: { imageCount: 1 },
          endpoint: '/images/generations',
          status: 'success',
          startedAt: new Date().toISOString(),
        },
      },
    ]);
    await sink.flush();

    expect(batchInsertRequests.mock.calls[0]?.[0][0]?.endpoint).toBe(
      '/images/generations',
    );
  });

  it('preserves the upstream status code on failed requests', async () => {
    const batchInsertRequests = vi.fn(
      async (_requests: LLMRequestInsert[]) => ({ count: 1 }),
    );
    const store = {
      batchInsertRequests,
      batchInsertSpans: vi.fn(async () => ({ count: 0 })),
      upsertTrace: vi.fn(async () => null),
    } as unknown as TelemetryStore;
    const sink = createStoreSink(store);

    sink.emit([
      {
        type: 'llm_request',
        request: {
          requestId: crypto.randomUUID(),
          provider: 'google',
          model: 'gemini-2.5-flash-image',
          input: {},
          output: null,
          endpoint: '/images/generations',
          statusCode: 429,
          status: 'error',
          startedAt: new Date().toISOString(),
        },
      },
    ]);
    await sink.flush();

    expect(batchInsertRequests.mock.calls[0]?.[0][0]?.statusCode).toBe(429);
  });

  it('persists linked span and trace events', async () => {
    const batchInsertSpans = vi.fn(async (_spans: SpanInsert[]) => ({
      count: 1,
    }));
    const upsertTrace = vi.fn(async (_trace: TraceUpsert) => undefined);
    const store = {
      batchInsertRequests: vi.fn(async () => ({ count: 0 })),
      batchInsertSpans,
      upsertTrace,
    } as unknown as TelemetryStore;
    const sink = createStoreSink(store);
    const traceId = '1'.repeat(32);
    const spanId = '2'.repeat(16);
    const startedAt = new Date().toISOString();

    sink.emit([
      {
        type: 'span',
        span: {
          traceId,
          spanId,
          name: 'openai/gpt-4o-mini',
          kind: 'server',
          usage: { inputTokens: 12, outputTokens: 3 },
          cost: 0.000009,
          status: 'ok',
          startedAt,
          endedAt: startedAt,
        },
        trace: {
          traceId,
          name: 'e2e-trace',
          status: 'ok',
          startedAt,
          endedAt: startedAt,
        },
      },
    ]);
    await sink.flush();

    expect(batchInsertSpans.mock.calls[0]?.[0][0]).toMatchObject({
      traceId,
      spanId,
      name: 'openai/gpt-4o-mini',
      status: 1,
    });
    expect(upsertTrace.mock.calls[0]?.[0]).toMatchObject({
      traceId,
      name: 'e2e-trace',
      status: 'ok',
      spanCount: 1,
      totalInputTokens: 12,
      totalOutputTokens: 3,
      totalTokens: 15,
      totalCost: 9,
    });
  });
});
