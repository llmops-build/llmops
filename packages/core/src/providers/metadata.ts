/**
 * Provider routing metadata — base URL + OpenAI-compatibility per provider.
 *
 * This is deliberately BUNDLED (not fetched at runtime): it's tiny, effectively
 * never changes, and sits on the routing hot path, so it must not depend on a
 * network call (a cold start, an edge deploy, or a models.llmops.build blip must
 * never block routing). Pricing — which is dynamic, large, and off the hot path
 * — stays a live fetch (see `getModelPricing`).
 *
 * `getProviderMetadata` is the default resolver. Override it via
 * `llmops({ getProviderMetadata })` to self-host, air-gap, or point at a live
 * endpoint.
 *
 * This is a curated bootstrap covering the common providers. The authoritative
 * source is the `llmops-build/models` repo — this table will be generated from
 * it at build time (keys match the `general/*.json` filenames).
 */
export interface ProviderMetadata {
  /**
   * Upstream base URL. Omitted for providers whose URL isn't static — Bedrock,
   * Vertex, Azure are region/resource-scoped, so they require an explicit
   * `baseURL` at call time.
   */
  baseURL?: string;
  /**
   * Whether the provider speaks the OpenAI wire format. `false` providers
   * (Anthropic, Google, Bedrock, …) need a dedicated adapter in the gateway.
   */
  openaiCompatible: boolean;
}

/** Curated provider metadata, keyed by provider id (the `llmops-build/models` filename). */
export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  // ── OpenAI-compatible (pass-through) ─────────────────────────────────
  openai: { baseURL: 'https://api.openai.com/v1', openaiCompatible: true },
  groq: { baseURL: 'https://api.groq.com/openai/v1', openaiCompatible: true },
  'mistral-ai': {
    baseURL: 'https://api.mistral.ai/v1',
    openaiCompatible: true,
  },
  'together-ai': {
    baseURL: 'https://api.together.xyz/v1',
    openaiCompatible: true,
  },
  'fireworks-ai': {
    baseURL: 'https://api.fireworks.ai/inference/v1',
    openaiCompatible: true,
  },
  deepseek: { baseURL: 'https://api.deepseek.com', openaiCompatible: true },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    openaiCompatible: true,
  },
  'x-ai': { baseURL: 'https://api.x.ai/v1', openaiCompatible: true },
  cerebras: { baseURL: 'https://api.cerebras.ai/v1', openaiCompatible: true },
  sambanova: { baseURL: 'https://api.sambanova.ai/v1', openaiCompatible: true },
  deepinfra: {
    baseURL: 'https://api.deepinfra.com/v1/openai',
    openaiCompatible: true,
  },
  'perplexity-ai': {
    baseURL: 'https://api.perplexity.ai',
    openaiCompatible: true,
  },
  nebius: {
    baseURL: 'https://api.studio.nebius.ai/v1',
    openaiCompatible: true,
  },
  'novita-ai': {
    baseURL: 'https://api.novita.ai/v3/openai',
    openaiCompatible: true,
  },
  moonshot: { baseURL: 'https://api.moonshot.ai/v1', openaiCompatible: true },
  ai21: { baseURL: 'https://api.ai21.com/studio/v1', openaiCompatible: true },
  jina: { baseURL: 'https://api.jina.ai/v1', openaiCompatible: true },
  'inference-net': {
    baseURL: 'https://api.inference.net/v1',
    openaiCompatible: true,
  },
  upstage: { baseURL: 'https://api.upstage.ai/v1', openaiCompatible: true },
  nscale: {
    baseURL: 'https://inference.api.nscale.com/v1',
    openaiCompatible: true,
  },
  'lemonfox-ai': {
    baseURL: 'https://api.lemonfox.ai/v1',
    openaiCompatible: true,
  },

  // ── Divergent — need a dedicated adapter (not OpenAI wire format) ─────
  anthropic: { baseURL: 'https://api.anthropic.com', openaiCompatible: false },
  // Gemini Developer API's official OpenAI compatibility surface. Native
  // generateContent / streamGenerateContent support belongs in a separate
  // adapter so Google-specific features can be preserved without translation.
  google: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    openaiCompatible: true,
  },
  cohere: { baseURL: 'https://api.cohere.com', openaiCompatible: false },
  palm: { openaiCompatible: false },
  bedrock: { openaiCompatible: false },
  'bedrock-mantle': { openaiCompatible: false },
  'claude-platform-aws': { openaiCompatible: false },
  'vertex-ai': { openaiCompatible: false },
  'azure-ai': { openaiCompatible: false },
  'azure-openai': { openaiCompatible: false },
  replicate: { openaiCompatible: false },

  // ── Non-chat (image / media) — not OpenAI chat-compatible ────────────
  'stability-ai': { openaiCompatible: false },
  'fal-ai': { openaiCompatible: false },
  segmind: { openaiCompatible: false },
};

/**
 * Default provider-metadata resolver — reads the bundled table above. Async to
 * match the injectable `getProviderMetadata` config signature (an override may
 * fetch from a network source). Returns `null` for providers not yet curated;
 * such providers are still routable if the caller supplies an explicit baseURL.
 */
export function getProviderMetadata(
  provider: string,
): Promise<ProviderMetadata | null> {
  return Promise.resolve(PROVIDER_METADATA[provider] ?? null);
}
