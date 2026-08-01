import type { ProviderConfig } from '../types/provider';
import type { RequestType } from '../types/requests';

/** Per-endpoint configuration for a provider adapter. */
export interface EndpointConfig {
  /** Build the full upstream URL for this endpoint. */
  getURL(config: ProviderConfig, requestType: RequestType): string;

  /** Build the upstream headers for this endpoint. */
  getHeaders(config: ProviderConfig, request: Request): Record<string, string>;

  /** Optional request body transform. Absent = stream body through as-is. */
  transformRequestBody?(body: unknown, config: ProviderConfig): unknown;

  /** Optional response body transform (non-streaming). */
  transformResponseBody?(body: unknown, config: ProviderConfig): unknown;

  /** Optional per-event SSE transform (for streaming responses). */
  transformStreamEvent?(event: string, config: ProviderConfig): string;
}

/** Provider adapter — one per upstream LLM provider. */
export interface ProviderAdapter {
  /** Provider name (used in error messages). */
  name: string;

  /** Supported endpoints. Missing keys = endpoint not supported by this provider. */
  endpoints: Partial<Record<RequestType, EndpointConfig>>;
}
