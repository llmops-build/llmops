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

export interface GatewayConfig {
  /** Providers this gateway can route to, resolved by slug from `@slug/model`. */
  providers?: ProviderInput[];
  /** Injected fetch (edge / testing). Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
  /** Custom adapters for non-OpenAI-compliant providers, keyed by provider id. */
  adapters?: Record<string, ProviderAdapter>;
}
