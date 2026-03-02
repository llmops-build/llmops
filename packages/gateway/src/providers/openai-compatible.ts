import type { ProviderConfig } from '../types/provider';
import { RequestType } from '../types/requests';
import type { EndpointConfig, ProviderAdapter } from './types';
import { bearerAuthHeader, defaultURL, extractForwardHeaders } from './utils';

/**
 * Factory for providers that are OpenAI-compatible:
 * same path layout, Bearer auth, no body transforms.
 */
export function openaiCompatible(
  name: string,
  defaultBaseURL: string
): ProviderAdapter {
  function resolveBaseURL(config: ProviderConfig): string {
    return config.baseURL ?? config.customHost ?? defaultBaseURL;
  }

  function makeEndpoint(): EndpointConfig {
    return {
      getURL(config, requestType) {
        return defaultURL(resolveBaseURL(config), requestType);
      },
      getHeaders(config, request) {
        return {
          ...bearerAuthHeader(config.apiKey),
          ...extractForwardHeaders(config, request),
        };
      },
    };
  }

  const endpoint = makeEndpoint();
  return {
    name,
    endpoints: Object.fromEntries(
      Object.values(RequestType).map((rt) => [rt, endpoint])
    ) as Record<RequestType, EndpointConfig>,
  };
}
