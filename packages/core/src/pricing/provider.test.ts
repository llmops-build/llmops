import { afterEach, describe, expect, it, vi } from 'vitest';
import { LLMOpsPricingProvider } from './provider';

function pricingResponse() {
  return new Response(
    JSON.stringify({
      pay_as_you_go: {
        request_token: { price: 0.00003 },
        response_token: { price: 0.00025 },
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('LLMOpsPricingProvider Google model tiers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to the <=128k catalog entry for a bare Gemini model', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(pricingResponse());
    vi.stubGlobal('fetch', fetchMock);
    const provider = new LLMOpsPricingProvider({
      baseUrl: 'https://models.test',
    });

    await expect(
      provider.getModelPricing('google', 'gemini-2.5-flash', 8),
    ).resolves.toEqual({
      inputCostPer1M: 0.3,
      outputCostPer1M: 2.5,
      cacheReadCostPer1M: undefined,
      cacheWriteCostPer1M: undefined,
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://models.test/model-configs/pricing/google/gemini-2.5-flash-lte-128k',
    );
  });

  it('uses the >128k catalog entry for large Gemini inputs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(pricingResponse());
    vi.stubGlobal('fetch', fetchMock);
    const provider = new LLMOpsPricingProvider({
      baseUrl: 'https://models.test',
    });

    await provider.getModelPricing('google', 'gemini-2.5-flash', 128_001);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://models.test/model-configs/pricing/google/gemini-2.5-flash-gt-128k',
    );
  });
});
