import { describe, expect, it, vi } from 'vitest';
import { createTelemetryDataset } from './dataset';

describe('createTelemetryDataset', () => {
  it('filters requests and hydrates input/output from the matching span', async () => {
    const createdAt = new Date('2026-07-31T10:00:00.000Z');
    const listRequests = vi.fn(async () => ({
      data: [
        {
          requestId: 'request-1',
          traceId: 'trace-1',
          spanId: 'span-1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          promptTokens: 12,
          completionTokens: 4,
          cachedTokens: 2,
          cost: 25,
          latencyMs: 80,
          endpoint: '/chat/completions',
          statusCode: 200,
          tags: { environment: 'production' },
          createdAt,
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
    }));
    const getTraceWithSpans = vi.fn(async () => ({
      trace: {},
      events: [],
      spans: [
        {
          requestId: 'request-1',
          spanId: 'span-1',
          input: { messages: [{ role: 'user', content: 'hello' }] },
          output: { content: 'hi' },
        },
      ],
    }));
    const dataset = createTelemetryDataset(
      { listRequests, getTraceWithSpans },
      {
        provider: 'openai',
        model: 'gpt-4o-mini',
        since: '7d',
        limit: 10,
        tags: { environment: ['production'] },
        map: (request) => ({
          data: request.input as { messages: unknown[] },
          target: request.output as { content: string },
          metadata: {
            requestId: request.requestId,
            cost: request.cost,
            inputTokens: request.usage?.inputTokens,
          },
        }),
      },
    );

    expect(await dataset.size()).toBe(1);
    expect(await dataset.get(0)).toEqual({
      data: { messages: [{ role: 'user', content: 'hello' }] },
      target: { content: 'hi' },
      metadata: { requestId: 'request-1', cost: 0.000025, inputTokens: 12 },
    });
    expect(listRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        model: 'gpt-4o-mini',
        limit: 10,
        tags: { environment: ['production'] },
        startDate: expect.any(Date),
      }),
    );
    expect(getTraceWithSpans).toHaveBeenCalledWith('trace-1');
  });

  it('loads once and reuses a trace shared by multiple requests', async () => {
    const listRequests = vi.fn(async () => ({
      data: [
        {
          requestId: 'request-1',
          traceId: 'trace-1',
          spanId: 'span-1',
          provider: 'openai',
          model: 'gpt-4o-mini',
          createdAt: '2026-07-31T10:00:00.000Z',
        },
        {
          requestId: 'request-2',
          traceId: 'trace-1',
          spanId: 'span-2',
          provider: 'openai',
          model: 'gpt-4o-mini',
          createdAt: '2026-07-31T10:00:01.000Z',
        },
      ],
      total: 2,
      limit: 100,
      offset: 0,
    }));
    const getTraceWithSpans = vi.fn(async () => ({
      trace: {},
      events: [],
      spans: [
        { requestId: 'request-1', spanId: 'span-1', output: 'one' },
        { requestId: 'request-2', spanId: 'span-2', output: 'two' },
      ],
    }));
    const dataset = createTelemetryDataset(
      { listRequests, getTraceWithSpans },
      { map: (request) => ({ data: request.output }) },
    );

    expect(await dataset.slice(0, 2)).toEqual([
      { data: 'one' },
      { data: 'two' },
    ]);
    expect(await dataset.size()).toBe(2);
    expect(listRequests).toHaveBeenCalledOnce();
    expect(getTraceWithSpans).toHaveBeenCalledOnce();
  });

  it('rejects an invalid relative or absolute date', async () => {
    const dataset = createTelemetryDataset(
      {
        listRequests: vi.fn(),
        getTraceWithSpans: vi.fn(),
      },
      { since: 'last-week', map: (request) => ({ data: request.input }) },
    );

    await expect(dataset.size()).rejects.toThrow('invalid since value');
  });
});
