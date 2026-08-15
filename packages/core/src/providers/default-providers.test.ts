import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROVIDER_MAPPINGS,
  getDefaultProviders,
  mergeWithDefaultProviders,
} from './default-providers';
import { PROVIDER_METADATA } from './metadata';

describe('DEFAULT_PROVIDER_MAPPINGS contract', () => {
  it('every advertised default provider has metadata', () => {
    for (const mapping of DEFAULT_PROVIDER_MAPPINGS) {
      const meta = PROVIDER_METADATA[mapping.provider];
      expect(meta, mapping.provider).toBeDefined();
    }
  });

  it('every advertised default provider has a base URL', () => {
    for (const mapping of DEFAULT_PROVIDER_MAPPINGS) {
      const meta = PROVIDER_METADATA[mapping.provider];
      expect(meta?.baseURL, mapping.provider).toBeDefined();
      expect(meta?.baseURL?.length, mapping.provider).toBeGreaterThan(0);
    }
  });

  it('every advertised default provider is OpenAI-compatible', () => {
    for (const mapping of DEFAULT_PROVIDER_MAPPINGS) {
      const meta = PROVIDER_METADATA[mapping.provider];
      expect(meta?.openaiCompatible, mapping.provider).toBe(true);
    }
  });

  it('no divergent provider appears in the auto-detect list', () => {
    const divergentInDefaults = DEFAULT_PROVIDER_MAPPINGS.filter((m) => {
      const meta = PROVIDER_METADATA[m.provider];
      return meta && meta.openaiCompatible === false;
    });
    expect(divergentInDefaults).toEqual([]);
  });
});

describe('getDefaultProviders', () => {
  it('returns an empty array when no env vars are set', () => {
    expect(getDefaultProviders({})).toEqual([]);
  });

  it('auto-detects only OpenAI-compatible providers', () => {
    const env = {
      OPENAI_API_KEY: 'sk-test',
      GROQ_API_KEY: 'gsk-test',
      ANTHROPIC_API_KEY: 'sk-ant-test', // divergent — should NOT appear
      COHERE_API_KEY: 'coh-test', // divergent — should NOT appear
      HUGGINGFACE_API_KEY: 'hf-test', // no metadata — should NOT appear
    };
    const providers = getDefaultProviders(env);
    const slugs = providers.map((p) => p.slug);

    expect(slugs).toContain('openai');
    expect(slugs).toContain('groq');
    expect(slugs).not.toContain('anthropic');
    expect(slugs).not.toContain('cohere');
    expect(slugs).not.toContain('huggingface');
  });

  it('excludes providers without metadata entirely', () => {
    const env = {
      HUGGINGFACE_API_KEY: 'hf-test',
      REPLICATE_API_TOKEN: 'r8-test',
    };
    expect(getDefaultProviders(env)).toEqual([]);
  });
});

describe('mergeWithDefaultProviders', () => {
  it('user providers take precedence and do not block valid defaults', () => {
    const env = {
      OPENAI_API_KEY: 'sk-default',
      GROQ_API_KEY: 'gsk-default',
    };
    const user = [{ provider: 'openai', slug: 'openai', apiKey: 'sk-user' }];
    const merged = mergeWithDefaultProviders(user, env);

    expect(merged).toHaveLength(2);
    expect(merged[0].apiKey).toBe('sk-user');
    expect(merged[1].slug).toBe('groq');
  });

  it('does not inject divergent defaults even when env vars are set', () => {
    const env = {
      OPENAI_API_KEY: 'sk-test',
      ANTHROPIC_API_KEY: 'sk-ant-test',
    };
    const merged = mergeWithDefaultProviders([], env);
    const slugs = merged.map((p) => p.slug);

    expect(slugs).toContain('openai');
    expect(slugs).not.toContain('anthropic');
  });
});
