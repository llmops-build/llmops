import { describe, expect, it } from 'vitest';
import { resolveTarget } from './resolve';
import type { ProviderMetadataResolver } from './types/config';

/** Stub resolver mirroring @llmops/core's bundled metadata. */
const metadata: ProviderMetadataResolver = async (provider) =>
  ({
    openai: { baseURL: 'https://api.openai.com/v1', openaiCompatible: true },
    anthropic: {
      baseURL: 'https://api.anthropic.com',
      openaiCompatible: false,
    },
    cohere: { baseURL: 'https://api.cohere.com', openaiCompatible: false },
    google: {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openaiCompatible: true,
    },
    groq: { baseURL: 'https://api.groq.com/openai/v1', openaiCompatible: true },
  })[provider] ?? null;

function makeProviders(
  entries: Array<{ provider: string; slug: string; baseURL?: string }>,
): Map<string, { provider: string; apiKey?: string; baseURL?: string }> {
  const map = new Map<string, { provider: string; apiKey?: string; baseURL?: string }>();
  for (const e of entries) {
    map.set(e.slug, {
      provider: e.provider,
      apiKey: 'test-key',
      baseURL: e.baseURL,
    });
  }
  return map;
}

describe('resolveTarget', () => {
  it('resolves an OpenAI-compatible provider', async () => {
    const providers = makeProviders([{ provider: 'openai', slug: 'openai' }]);
    const result = await resolveTarget('openai', 'gpt-4o', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.config.baseURL).toBe('https://api.openai.com/v1');
    expect(result.value.config.provider).toBe('openai');
    expect(result.value.model).toBe('gpt-4o');
  });

  it('resolves Google through its OpenAI compatibility endpoint', async () => {
    const providers = makeProviders([{ provider: 'google', slug: 'google' }]);
    const result = await resolveTarget('google', 'gemini-2.5-flash', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.config.baseURL).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai',
    );
  });

  it('rejects a divergent provider without a dedicated adapter', async () => {
    const providers = makeProviders([
      { provider: 'anthropic', slug: 'anthropic' },
    ]);
    const result = await resolveTarget('anthropic', 'claude-3', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('not OpenAI-compatible');
    expect(result.error.message).toContain('no dedicated adapter');
  });

  it('rejects another divergent provider (Cohere) without a dedicated adapter', async () => {
    const providers = makeProviders([
      { provider: 'cohere', slug: 'cohere' },
    ]);
    const result = await resolveTarget('cohere', 'command-r', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(400);
    expect(result.error.message).toContain('not OpenAI-compatible');
  });

  it('allows a divergent provider when an explicit adapter override is supplied', async () => {
    const providers = makeProviders([
      { provider: 'anthropic', slug: 'anthropic' },
    ]);
    const customAdapter = {
      name: 'anthropic',
      endpoints: {},
    };

    const result = await resolveTarget('anthropic', 'claude-3', providers, {
      getProviderMetadata: metadata,
      adapters: { anthropic: customAdapter },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.adapter).toBe(customAdapter);
    expect(result.value.config.baseURL).toBe('https://api.anthropic.com');
  });

  it('preserves an explicit baseURL over metadata', async () => {
    const providers = makeProviders([
      { provider: 'openai', slug: 'openai', baseURL: 'https://proxy.example.com/v1' },
    ]);
    const result = await resolveTarget('openai', 'gpt-4o', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.config.baseURL).toBe('https://proxy.example.com/v1');
  });

  it('rejects an unconfigured slug', async () => {
    const providers = makeProviders([]);
    const result = await resolveTarget('unknown', 'model', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(400);
    expect(result.error.message).toContain('No provider configured');
  });

  it('rejects a provider with no baseURL and no metadata', async () => {
    const providers = makeProviders([
      { provider: 'unknownco', slug: 'unknownco' },
    ]);
    const result = await resolveTarget('unknownco', 'model', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(400);
    expect(result.error.message).toContain('No base URL');
  });

  it('does not reject when metadata is null (uncurated provider with explicit baseURL)', async () => {
    const providers = makeProviders([
      { provider: 'custom', slug: 'custom', baseURL: 'https://custom.ai/v1' },
    ]);
    const result = await resolveTarget('custom', 'model', providers, {
      getProviderMetadata: metadata,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.config.baseURL).toBe('https://custom.ai/v1');
  });
});
