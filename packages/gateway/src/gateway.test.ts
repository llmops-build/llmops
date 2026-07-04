import { describe, expect, it, vi } from 'vitest';
import { createGateway } from './gateway';
import type { ProviderMetadataResolver } from './types/config';

/** Stub resolver — stands in for @llmops/core's getProviderMetadata. */
const metadata: ProviderMetadataResolver = async (provider) =>
  ({
    openai: { baseURL: 'https://api.openai.com/v1', openaiCompatible: true },
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
