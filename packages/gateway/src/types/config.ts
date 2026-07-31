import type { ModelPricing, TelemetrySink } from '@llmops/core';
import type { ProviderAdapter } from '../providers/types';

/**
 * A provider the gateway can route to. OpenAI-compliant by default: give it a
 * slug + apiKey and requests pass straight through. Providers that diverge from
 * OpenAI are handled by registering a custom adapter (see GatewayConfig.adapters).
 */
export interface ProviderInput {
  /** Provider id — selects the adapter and the default base URL (e.g. 'openai', 'groq'). */
  provider: string;
  /** Routing key used in the model string `@<slug>/<model>`. */
  slug: string;
  /** Upstream API key. */
  apiKey?: string;
  /** Override the upstream base URL (else the provider's known default). */
  baseURL?: string;
  /** Headers to forward as-is from the incoming request. */
  forwardHeaders?: string[];
}

/** Provider routing metadata resolved for a request. */
export interface ResolvedProviderMetadata {
  baseURL?: string;
  openaiCompatible?: boolean;
}

/**
 * Resolves a provider's routing metadata (base URL + compatibility) by id.
 * Injected so the gateway stays zero-dependency — the composition root passes
 * `@llmops/core`'s `getProviderMetadata` (or a user override).
 */
export type ProviderMetadataResolver = (
  provider: string,
) => Promise<ResolvedProviderMetadata | null>;

export interface GatewayConfig {
  /** Providers this gateway can route to, resolved by slug from `@slug/model`. */
  providers?: ProviderInput[];
  /** Injected fetch (edge / testing). Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
  /** Custom adapters for non-OpenAI-compliant providers, keyed by provider id. */
  adapters?: Record<string, ProviderAdapter>;
  /**
   * Resolve a provider's base URL + compatibility. Injected (e.g.
   * `@llmops/core`'s `getProviderMetadata`). Without it, a provider needs an
   * explicit `baseURL`.
   */
  getProviderMetadata?: ProviderMetadataResolver;
  /**
   * Where usage/cost telemetry is emitted. When absent, the gateway is a pure
   * proxy — no clone, no tee, zero added latency.
   */
  telemetry?: TelemetrySink;
  /**
   * Resolve model pricing so cost can be attached to telemetry. Injected (e.g.
   * `@llmops/core`'s `getModelPricing`).
   */
  getModelPricing?: (
    provider: string,
    model: string,
    inputTokens?: number,
  ) => Promise<ModelPricing | null>;
  /**
   * Edge background-work hook (`ctx.waitUntil`). Keeps the worker alive while
   * telemetry is metered off-band after the response is returned.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}
