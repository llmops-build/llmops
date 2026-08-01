import { describe, expect, it } from 'vitest';
import { getProviderMetadata, PROVIDER_METADATA } from './metadata';

describe('getProviderMetadata', () => {
  it('returns baseURL + compat for a known OpenAI-compatible provider', async () => {
    expect(await getProviderMetadata('groq')).toEqual({
      baseURL: 'https://api.groq.com/openai/v1',
      openaiCompatible: true,
    });
  });

  it('flags divergent providers as not OpenAI-compatible', async () => {
    expect((await getProviderMetadata('anthropic'))?.openaiCompatible).toBe(
      false,
    );
    expect((await getProviderMetadata('bedrock'))?.openaiCompatible).toBe(
      false,
    );
  });

  it('routes Google Gemini through its official OpenAI compatibility API', async () => {
    expect(await getProviderMetadata('google')).toEqual({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      openaiCompatible: true,
    });
  });

  it('returns null for an uncurated / unknown provider', async () => {
    expect(await getProviderMetadata('does-not-exist')).toBeNull();
  });

  it('every entry declares a boolean openaiCompatible', () => {
    for (const [name, meta] of Object.entries(PROVIDER_METADATA)) {
      expect(typeof meta.openaiCompatible, name).toBe('boolean');
    }
  });
});
