import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { proxyRequest } from './proxy';
import type { ProviderConfig } from './types/provider';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  path: string,
  options?: { method?: string; headers?: Record<string, string>; body?: string }
): Request {
  return new Request(`http://localhost${path}`, {
    method: options?.method ?? 'POST',
    headers: {
      'content-type': 'application/json',
      ...options?.headers,
    },
    body: options?.body ?? JSON.stringify({ model: 'test-model', messages: [] }),
  });
}

// ---------------------------------------------------------------------------
// 1. All 11 Endpoint Types (OpenAI)
// ---------------------------------------------------------------------------

describe('All OpenAI endpoint types', () => {
  const endpointPaths = [
    '/chat/completions',
    '/completions',
    '/responses',
    '/embeddings',
    '/images/generations',
    '/images/edits',
    '/images/variations',
    '/moderations',
    '/audio/transcriptions',
    '/audio/translations',
    '/audio/speech',
  ] as const;

  test.each(endpointPaths)(
    'routes /v1%s to the correct OpenAI URL',
    async (path) => {
      mockFetch.mockResolvedValueOnce(Response.json({ ok: true }, { status: 200 }));

      const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
      const response = await proxyRequest(config, makeRequest(`/v1${path}`));

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`https://api.openai.com/v1${path}`);
      expect(init.headers['Authorization']).toBe('Bearer sk-test');
    }
  );
});

// ---------------------------------------------------------------------------
// 2. OpenAI-Compatible Providers
// ---------------------------------------------------------------------------

describe('OpenAI-compatible providers', () => {
  const providers: [string, string][] = [
    ['groq', 'https://api.groq.com/openai/v1'],
    ['together', 'https://api.together.xyz/v1'],
    ['deepseek', 'https://api.deepseek.com/v1'],
    ['fireworks', 'https://api.fireworks.ai/inference/v1'],
    ['perplexity', 'https://api.perplexity.ai'],
    ['mistral', 'https://api.mistral.ai/v1'],
    ['openrouter', 'https://openrouter.ai/api/v1'],
    ['cerebras', 'https://api.cerebras.ai/v1'],
    ['sambanova', 'https://api.sambanova.ai/v1'],
    ['anyscale', 'https://api.endpoints.anyscale.com/v1'],
    ['novita', 'https://api.novita.ai/v3/openai'],
  ];

  test.each(providers)(
    '%s → routes chat completions to correct upstream URL',
    async (provider, baseURL) => {
      mockFetch.mockResolvedValueOnce(
        Response.json({ id: `chatcmpl-${provider}` }, { status: 200 })
      );

      const config: ProviderConfig = { provider, apiKey: 'key-test' };
      const response = await proxyRequest(
        config,
        makeRequest('/v1/chat/completions')
      );

      expect(response.status).toBe(200);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${baseURL}/chat/completions`);
      expect(init.headers['Authorization']).toBe('Bearer key-test');
    }
  );
});

// ---------------------------------------------------------------------------
// 3. Configuration Variants
// ---------------------------------------------------------------------------

describe('Configuration variants', () => {
  test('customHost fallback (deprecated) is used when baseURL is absent', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      customHost: 'https://custom.example.com/v1',
    };

    await proxyRequest(config, makeRequest('/v1/chat/completions'));

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://custom.example.com/v1/chat/completions');
  });

  test('baseURL takes precedence over customHost', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      baseURL: 'https://preferred.example.com/v1',
      customHost: 'https://deprecated.example.com/v1',
    };

    await proxyRequest(config, makeRequest('/v1/chat/completions'));

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://preferred.example.com/v1/chat/completions');
  });

  test('no apiKey → no Authorization header sent', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = { provider: 'openai' };

    await proxyRequest(config, makeRequest('/v1/chat/completions'));

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['Authorization']).toBeUndefined();
  });

  test('openaiBeta header forwarded', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      openaiBeta: 'assistants=v2',
    };

    await proxyRequest(config, makeRequest('/v1/chat/completions'));

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['OpenAI-Beta']).toBe('assistants=v2');
  });

  test('forwardHeaders: absent header is not included', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      forwardHeaders: ['X-Missing-Header'],
    };

    await proxyRequest(config, makeRequest('/v1/chat/completions'));

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['X-Missing-Header']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Upstream Error Handling
// ---------------------------------------------------------------------------

describe('Upstream error handling', () => {
  test('429 rate limit response passed through with body intact', async () => {
    const body = {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
      },
    };
    mockFetch.mockResolvedValueOnce(
      Response.json(body, { status: 429, statusText: 'Too Many Requests' })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions')
    );

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error.message).toBe('Rate limit exceeded');
    expect(json.error.type).toBe('rate_limit_error');
  });

  test('500 server error passed through', async () => {
    const body = {
      error: {
        message: 'Internal server error',
        type: 'server_error',
      },
    };
    mockFetch.mockResolvedValueOnce(
      Response.json(body, { status: 500, statusText: 'Internal Server Error' })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions')
    );

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.message).toBe('Internal server error');
  });

  test('non-JSON error body passed through as-is', async () => {
    const textBody = 'Service Unavailable — please try again later';
    mockFetch.mockResolvedValueOnce(
      new Response(textBody, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'content-type': 'text/plain' },
      })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions')
    );

    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).toBe(textBody);
  });
});

// ---------------------------------------------------------------------------
// 5. Streaming
// ---------------------------------------------------------------------------

describe('Streaming', () => {
  test('multi-chunk SSE delivery — all data events present', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'data: {"id":"1","choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"id":"2","choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: {"id":"3","choices":[{"delta":{"content":"!"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions', {
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [],
          stream: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('"id":"1"');
    expect(text).toContain('"id":"2"');
    expect(text).toContain('"id":"3"');
    expect(text).toContain('[DONE]');
  });

  test('streaming response preserves content-type: text/event-stream', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"id":"1","choices":[]}\n\ndata: [DONE]\n\n')
        );
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions', {
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [],
          stream: true,
        }),
      })
    );

    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  test('empty stream (just [DONE])', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/chat/completions', {
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [],
          stream: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('[DONE]');
    // No data events before DONE
    expect(text).not.toContain('"choices"');
  });
});

// ---------------------------------------------------------------------------
// 6. Content-Type Preservation
// ---------------------------------------------------------------------------

describe('Content-type preservation', () => {
  test('multipart/form-data forwarded to upstream (audio endpoints)', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ text: 'Hello world' }, { status: 200 })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const boundary = '----FormBoundary123';
    const formBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="audio.mp3"',
      'Content-Type: audio/mpeg',
      '',
      'fake-audio-data',
      `--${boundary}`,
      'Content-Disposition: form-data; name="model"',
      '',
      'whisper-1',
      `--${boundary}--`,
    ].join('\r\n');

    const request = new Request('http://localhost/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formBody,
    });

    await proxyRequest(config, request);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['content-type']).toBe(
      `multipart/form-data; boundary=${boundary}`
    );
  });

  test('response content-type from upstream preserved in gateway response', async () => {
    const audioData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    mockFetch.mockResolvedValueOnce(
      new Response(audioData, {
        status: 200,
        headers: { 'content-type': 'audio/mpeg' },
      })
    );

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const response = await proxyRequest(
      config,
      makeRequest('/v1/audio/speech')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
  });
});
