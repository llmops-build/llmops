import { describe, expect, it, vi } from 'vitest';
import { createGateway } from './gateway';
import type { ProviderMetadataResolver } from './types/config';

/** Stub resolver — stands in for @llmops/core's getProviderMetadata. */
const metadata: ProviderMetadataResolver = async (provider) =>
  ({
    openai: { baseURL: 'https://api.openai.com/v1', openaiCompatible: true },
    google: {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openaiCompatible: true,
    },
  })[provider] ?? null;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function chatRequest(model: string): Request {
  return new Request('http://gateway/api/genai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: 'hi' }] }),
  });
}

function imageRequest(model: string): Request {
  return new Request('http://gateway/api/genai/v1/images/generations', {
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

function responsesRequest(model: string): Request {
  return new Request('http://gateway/api/genai/v1/responses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      input: 'Say hello',
      stream: true,
      stream_options: { include_obfuscation: false },
    }),
  });
}

describe('createGateway', () => {
  it('resolves the base URL via the injected getProviderMetadata + Bearer auth + stripped model', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 'ok' }));
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'sk-test' }],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer sk-test',
    );
    expect(JSON.parse(init.body as string).model).toBe('gpt-4o');
  });

  it('an explicit baseURL overrides the resolver', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 'ok' }));
    const gw = createGateway({
      providers: [
        {
          provider: 'openai',
          slug: 'openai',
          apiKey: 'x',
          baseURL: 'https://example.com/v1',
        },
      ],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });

    await gw(chatRequest('@openai/gpt-4o'));
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com/v1/chat/completions');
  });

  it('routes Gemini through Google OpenAI compatibility with Bearer auth', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: 'gemini-ok',
        choices: [{ message: { role: 'assistant', content: 'hello' } }],
      }),
    );
    const gw = createGateway({
      providers: [{ provider: 'google', slug: 'google', apiKey: 'google-key' }],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@google/gemini-2.5-flash'));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe('gemini-ok');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer google-key',
    );
    expect(JSON.parse(init.body as string).model).toBe('gemini-2.5-flash');
  });

  it('routes Gemini image generation through the compatibility endpoint unchanged', async () => {
    const upstreamBody = {
      created: 1,
      data: [{ b64_json: 'image-bytes', revised_prompt: 'A tiny robot' }],
    };
    const fetchMock = vi.fn(async () => jsonResponse(upstreamBody));
    const gw = createGateway({
      providers: [{ provider: 'google', slug: 'google', apiKey: 'google-key' }],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(
      imageRequest('@google/gemini-2.5-flash-image'),
    );
    expect(await res.json()).toEqual(upstreamBody);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/images/generations',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer google-key',
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'gemini-2.5-flash-image',
      response_format: 'b64_json',
      n: 1,
    });
  });

  it('does not inject Chat Completions stream options into Responses requests', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: 'resp_1',
        status: 'completed',
        output: [],
        usage: { input_tokens: 2, output_tokens: 1, total_tokens: 3 },
      }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'sk-test' }],
      getProviderMetadata: metadata,
      telemetry: { emit: () => {}, flush: async () => {} },
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(responsesRequest('@openai/gpt-5.4'));
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'gpt-5.4',
      stream: true,
      stream_options: { include_obfuscation: false },
    });
    expect(JSON.parse(init.body as string).stream_options).not.toHaveProperty(
      'include_usage',
    );
  });

  it('returns the upstream response body unchanged (pass-through)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: 'chatcmpl-1', ok: true }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
      getProviderMetadata: metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect(await res.json()).toEqual({ id: 'chatcmpl-1', ok: true });
  });

  it('400s when neither an explicit baseURL nor the resolver supply one', async () => {
    const gw = createGateway({
      providers: [{ provider: 'unknownco', slug: 'x', apiKey: 'k' }],
      getProviderMetadata: metadata, // returns null for 'unknownco'
    });
    expect((await gw(chatRequest('@x/model'))).status).toBe(400);
  });

  it('400s when the model lacks the @slug/ prefix', async () => {
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
      getProviderMetadata: metadata,
    });
    expect((await gw(chatRequest('gpt-4o'))).status).toBe(400);
  });

  it('400s for an unconfigured slug', async () => {
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
      getProviderMetadata: metadata,
    });
    expect((await gw(chatRequest('@unknown/model'))).status).toBe(400);
  });

  it('404s for an unroutable path', async () => {
    const gw = createGateway({});
    const res = await gw(
      new Request('http://gateway/nope', { method: 'POST', body: '{}' }),
    );
    expect(res.status).toBe(404);
  });
});
