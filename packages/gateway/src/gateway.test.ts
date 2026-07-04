import { describe, expect, it, vi } from 'vitest';
import { createGateway } from './gateway';

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
  it('routes @openai/gpt-4o upstream with Bearer auth and a stripped model', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 'ok' }));
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'sk-test' }],
      fetch: fetchMock as unknown as typeof fetch,
    });

    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer sk-test',
    );
    expect(JSON.parse(init.body as string).model).toBe('gpt-4o');
  });

  it('honors a custom slug + baseURL (OpenAI-compatible by default)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 'ok' }));
    const gw = createGateway({
      providers: [
        {
          provider: 'groq',
          slug: 'fast',
          apiKey: 'gsk',
          baseURL: 'https://example.com/v1',
        },
      ],
      fetch: fetchMock as unknown as typeof fetch,
    });

    await gw(chatRequest('@fast/llama-3.1-70b'));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com/v1/chat/completions');
    expect(JSON.parse(init.body as string).model).toBe('llama-3.1-70b');
  });

  it('returns the upstream response body unchanged (pass-through)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: 'chatcmpl-1', ok: true }),
    );
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await gw(chatRequest('@openai/gpt-4o'));
    expect(await res.json()).toEqual({ id: 'chatcmpl-1', ok: true });
  });

  it('400s when the model lacks the @slug/ prefix', async () => {
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
    });
    expect((await gw(chatRequest('gpt-4o'))).status).toBe(400);
  });

  it('400s for an unconfigured slug', async () => {
    const gw = createGateway({
      providers: [{ provider: 'openai', slug: 'openai', apiKey: 'x' }],
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
