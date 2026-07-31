import { describe, expect, it, vi } from 'vitest';
import { createGateway } from './gateway';
import type { ProviderMetadataResolver } from './types/config';

const metadata: ProviderMetadataResolver = async () => ({
  baseURL: 'https://api.openai.com/v1',
  openaiCompatible: true,
});

// biome-ignore lint/suspicious/noExplicitAny: test stub
const pricing = async (): Promise<any> => ({
  inputCostPer1M: 2.5,
  outputCostPer1M: 10,
});

function harness() {
  // biome-ignore lint/suspicious/noExplicitAny: collecting sink for assertions
  const events: any[] = [];
  const pending: Promise<unknown>[] = [];
  return {
    events,
    settle: () => Promise.all(pending),
    // biome-ignore lint/suspicious/noExplicitAny: minimal sink stub
    telemetry: { emit: (e: any[]) => events.push(...e), flush: async () => {} },
    waitUntil: (p: Promise<unknown>) => {
      pending.push(p);
    },
  };
}

function chatRequest(model: string, stream = false): Request {
  return new Request('http://gw/api/genai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
}

function imageRequest(model: string): Request {
  return new Request('http://gw/api/genai/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: 'A tiny robot tending a rooftop garden',
      response_format: 'b64_json',
      n: 1,
    }),
  });
}

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(enc.encode(chunk));
      c.close();
    },
  });
}

describe('gateway telemetry', () => {
  it('emits an llm_request with usage + cost (non-streaming)', async () => {
    const h = harness();
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { role: 'assistant', content: 'hey' } }],
            usage: { prompt_tokens: 1000, completion_tokens: 500 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'k' }],
      getProviderMetadata: metadata,
      getModelPricing: pricing,
      // biome-ignore lint/suspicious/noExplicitAny: stub
      telemetry: h.telemetry as any,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect((await res.json()).choices[0].message.content).toBe('hey');

    await h.settle();
    expect(h.events).toHaveLength(2);
    const { type, request } = h.events[0];
    expect(type).toBe('llm_request');
    expect(request.provider).toBe('openai');
    expect(request.model).toBe('gpt-4o');
    expect(request.usage).toMatchObject({ inputTokens: 1000, outputTokens: 500 });
    // (1000*2.5 + 500*10)/1e6 = 7500/1e6 = 0.0075 dollars
    expect(request.cost).toBeCloseTo(0.0075);
    expect(request.status).toBe('success');
    expect(typeof request.latencyMs).toBe('number');
    expect(request.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(request.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(res.headers.get('x-llmops-trace-id')).toBe(request.traceId);
    expect(res.headers.get('x-llmops-span-id')).toBe(request.spanId);

    const spanEvent = h.events[1];
    expect(spanEvent.type).toBe('span');
    expect(spanEvent.span).toMatchObject({
      traceId: request.traceId,
      spanId: request.spanId,
      status: 'ok',
      kind: 'server',
    });
    expect(spanEvent.trace).toMatchObject({
      traceId: request.traceId,
      status: 'ok',
    });
  });

  it('streaming: caller gets the full stream, one event from the terminal usage chunk', async () => {
    const h = harness();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"he"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"y"}}]}\n\n',
      'data: {"choices":[],"usage":{"prompt_tokens":100,"completion_tokens":50}}\n\n',
      'data: [DONE]\n\n',
    ];
    const fetchMock = vi.fn(
      async () =>
        new Response(sseStream(chunks), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'k' }],
      getProviderMetadata: metadata,
      getModelPricing: pricing,
      // biome-ignore lint/suspicious/noExplicitAny: stub
      telemetry: h.telemetry as any,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@openai/gpt-4o', true));
    expect(await res.text()).toBe(chunks.join('')); // caller received every byte

    await h.settle();
    expect(h.events).toHaveLength(2);
    expect(h.events[0].request.usage).toMatchObject({
      inputTokens: 100,
      outputTokens: 50,
    });
    // (100*2.5 + 50*10)/1e6 = 750/1e6 = 0.00075
    expect(h.events[0].request.cost).toBeCloseTo(0.00075);
    expect(h.events[0].request.isStreaming).toBe(true);
    expect(h.events[1].span.attributes['llmops.is_streaming']).toBe(true);

    // the forwarded request opted into usage
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string).stream_options).toEqual({
      include_usage: true,
    });
  });

  it('meters and traces a Google Gemini compatibility stream', async () => {
    const h = harness();
    const chunks = [
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n',
      'data: {"choices":[],"usage":{"prompt_tokens":20,"completion_tokens":5,"total_tokens":30}}\n\n',
      'data: [DONE]\n\n',
    ];
    const fetchMock = vi.fn(
      async () =>
        new Response(sseStream(chunks), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
    );
    const googleMetadata: ProviderMetadataResolver = async () => ({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openaiCompatible: true,
    });
    const gw = createGateway({
      providers: [{ provider: 'google', slug: 'google', apiKey: 'google-key' }],
      getProviderMetadata: googleMetadata,
      getModelPricing: pricing,
      // biome-ignore lint/suspicious/noExplicitAny: minimal test sink
      telemetry: h.telemetry as any,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@google/gemini-2.5-flash', true));
    expect(await res.text()).toBe(chunks.join(''));
    await h.settle();

    expect(h.events[0].request).toMatchObject({
      provider: 'google',
      model: 'gemini-2.5-flash',
      usage: { inputTokens: 20, outputTokens: 10 },
      isStreaming: true,
      status: 'success',
    });
    expect(h.events[1].span).toMatchObject({
      traceId: h.events[0].request.traceId,
      spanId: h.events[0].request.spanId,
      status: 'ok',
    });
    expect(res.headers.get('x-llmops-trace-id')).toBe(
      h.events[0].request.traceId,
    );
    expect(h.events[0].request.cost).toBeCloseTo(0.00015);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer google-key',
    );
  });

  it('traces image generation without copying base64 output into telemetry', async () => {
    const h = harness();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          created: 1,
          data: [
            {
              b64_json: 'very-large-image-bytes',
              revised_prompt: 'A tiny helpful robot',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const googleMetadata: ProviderMetadataResolver = async () => ({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openaiCompatible: true,
    });
    const gw = createGateway({
      providers: [{ provider: 'google', slug: 'google', apiKey: 'google-key' }],
      getProviderMetadata: googleMetadata,
      telemetry: h.telemetry as never,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(
      imageRequest('@google/gemini-2.5-flash-image'),
    );
    expect((await res.json()).data[0].b64_json).toBe(
      'very-large-image-bytes',
    );
    await h.settle();

    expect(h.events[0].request).toMatchObject({
      provider: 'google',
      model: 'gemini-2.5-flash-image',
      endpoint: '/images/generations',
      output: {
        imageCount: 1,
        images: [
          {
            format: 'b64_json',
            revisedPrompt: 'A tiny helpful robot',
          },
        ],
      },
      status: 'success',
    });
    expect(JSON.stringify(h.events)).not.toContain('very-large-image-bytes');
    expect(h.events[1].span.attributes).toMatchObject({
      'gen_ai.operation.name': 'image_generation',
      'gen_ai.request.endpoint': '/images/generations',
    });
  });

  it('no telemetry configured → same Response, nothing metered', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'k' }],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect((await res.json()).ok).toBe(true);
  });

  it('upstream error → emits status:error and passes the body through', async () => {
    const h = harness();
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: 'nope' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'k' }],
      getProviderMetadata: metadata,
      // biome-ignore lint/suspicious/noExplicitAny: stub
      telemetry: h.telemetry as any,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('nope');

    await h.settle();
    expect(h.events).toHaveLength(2);
    expect(h.events[0].request.status).toBe('error');
    expect(h.events[0].request.statusCode).toBe(401);
    expect(h.events[1].span.status).toBe('error');
  });

  it('continues incoming W3C trace context and applies trace names', async () => {
    const h = harness();
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { role: 'assistant', content: 'hey' } }],
            usage: { prompt_tokens: 1, completion_tokens: 1 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    const traceId = '11111111111111111111111111111111';
    const parentSpanId = '2222222222222222';
    const req = chatRequest('@openai/gpt-4o');
    req.headers.set('traceparent', `00-${traceId}-${parentSpanId}-01`);
    req.headers.set('x-llmops-trace-name', 'checkout-agent');
    req.headers.set('x-llmops-span-name', 'generate-answer');
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'k' }],
      getProviderMetadata: metadata,
      telemetry: h.telemetry as never,
      waitUntil: h.waitUntil,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(req);
    await res.text();
    await h.settle();

    const spanEvent = h.events[1];
    expect(spanEvent.span).toMatchObject({
      traceId,
      parentSpanId,
      name: 'generate-answer',
    });
    expect(spanEvent.trace).toMatchObject({
      traceId,
      name: 'checkout-agent',
    });
    expect(res.headers.get('traceparent')).toMatch(
      new RegExp(`^00-${traceId}-[0-9a-f]{16}-01$`),
    );
  });
});
