import { describe, test, expect } from 'vitest';
import { proxyRequest } from './proxy';
import type { ProviderConfig } from './types';

describe('proxyRequest', () => {
  test('returns 501 for unimplemented provider', async () => {
    const config: ProviderConfig = { provider: 'openai', apiKey: 'sk-test' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4', messages: [] }),
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body.error.type).toBe('server_error');
    expect(body.error.message).toContain('openai');
    expect(body.error.message).toContain('not yet implemented');
  });

  test('includes provider name in error message', async () => {
    const config: ProviderConfig = { provider: 'anthropic' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
    });

    const response = await proxyRequest(config, request);
    const body = await response.json();

    expect(body.error.message).toContain('anthropic');
  });

  test('accepts config with only provider field', async () => {
    const config: ProviderConfig = { provider: 'bedrock' };
    const request = new Request('http://localhost/v1/chat/completions', {
      method: 'POST',
    });

    const response = await proxyRequest(config, request);

    expect(response.status).toBe(501);
  });
});
