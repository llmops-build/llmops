import { RequestType } from '../types/requests';
import type { EndpointConfig, ProviderAdapter } from './types';
import { bearerAuthHeader, defaultURL, extractForwardHeaders } from './utils';

/**
 * The default adapter: assume an OpenAI-compatible provider. Every endpoint is
 * pure pass-through — `<baseURL><path>` with a Bearer auth header, body
 * forwarded untouched. Providers that diverge from OpenAI register their own
 * adapter instead of using this.
 */
export function openaiCompatible(name: string): ProviderAdapter {
  const endpoint: EndpointConfig = {
    getURL: (config, requestType) =>
      defaultURL(config.baseURL ?? '', requestType),
    getHeaders: (config, request) => ({
      ...bearerAuthHeader(config.apiKey),
      ...extractForwardHeaders(config, request),
    }),
  };
  return {
    name,
    endpoints: Object.fromEntries(
      Object.values(RequestType).map((rt) => [rt, endpoint]),
    ) as Record<RequestType, EndpointConfig>,
  };
}
