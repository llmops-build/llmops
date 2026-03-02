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

describe('proxyRequest', () => {
  test('routes /chat/completions to OpenAI', async () => {
    const upstream = Response.json(
      { id: 'chatcmpl-1', choices: [] },
      { status: 200 }
    );
    mockFetch.mockResolvedValueOnce(upstream);

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe('chatcmpl-1');

    // Verify fetch was called with correct URL and headers
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer sk-test');
  });

  test('routes /embeddings to OpenAI', async () => {
    const upstream = Response.json(
      { data: [{ embedding: [0.1, 0.2] }] },
      { status: 200 }
    );
    mockFetch.mockResolvedValueOnce(upstream);

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const request = new Request('http://localhost/v1/embeddings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: 'hi' }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(200);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/embeddings');
  });

  test('includes OpenAI-specific headers when configured', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      openaiOrganization: 'org-123',
      openaiProject: 'proj-456',
    };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    await proxyRequest(config, request);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['OpenAI-Organization']).toBe('org-123');
    expect(init.headers['OpenAI-Project']).toBe('proj-456');
  });

  test('uses custom baseURL when provided', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      baseURL: 'https://my-proxy.example.com/v1',
    };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    await proxyRequest(config, request);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(
      'https://my-proxy.example.com/v1/chat/completions'
    );
  });

  test('returns 500 for unknown provider', async () => {
    const config: ProviderConfig = { provider: 'nonexistent' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.type).toBe('server_error');
    expect(body.error.message).toContain('nonexistent');
    expect(body.error.message).toContain('not supported');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('returns 404 for unsupported endpoint path', async () => {
    const config: ProviderConfig = { provider: 'openai' };
    const request = new Request('http://localhost/v1/unknown', {
      method: 'POST',
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.type).toBe('not_found_error');
    expect(body.error.message).toContain('/v1/unknown');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('passes through upstream error responses', async () => {
    const errorBody = {
      error: { message: 'Invalid API key', type: 'authentication_error' },
    };
    mockFetch.mockResolvedValueOnce(
      Response.json(errorBody, { status: 401, statusText: 'Unauthorized' })
    );

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-invalid',
    };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.message).toBe('Invalid API key');
  });

  test('returns 500 when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.type).toBe('server_error');
    expect(body.error.message).toContain('Connection refused');
  });

  test('passes through request body as-is for OpenAI (no transform)', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const requestBody = { model: 'gpt-4', messages: [{ role: 'user', content: 'hi' }] };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    await proxyRequest(config, request);

    const [, init] = mockFetch.mock.calls[0];
    // Body should be passed through as a ReadableStream (not parsed)
    expect(init.body).toBeDefined();
  });

  test('routes OpenAI-compatible provider (groq)', async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json({ id: 'chatcmpl-groq' }, { status: 200 })
    );

    const config: ProviderConfig = { provider: 'groq', apiKey: 'gsk-test' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(200);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.headers['Authorization']).toBe('Bearer gsk-test');
  });

  test('passes through streaming response as-is when no transform', async () => {
    const encoder = new TextEncoder();
    const sseData = [
      'data: {"id":"1","choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
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
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [],
        stream: true,
      }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('data: {"id":"1"');
    expect(text).toContain('[DONE]');
  });

  test('forwards specified headers to upstream', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test',
      forwardHeaders: ['X-Custom-Header'],
    };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    await proxyRequest(config, request);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['X-Custom-Header']).toBe('custom-value');
  });
});
