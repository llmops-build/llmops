import type { ProviderConfig } from '../types/provider';
import type { RequestType } from '../types/requests';

/** Build a default upstream URL: baseURL + request-type path. */
export function defaultURL(baseURL: string, requestType: RequestType): string {
  const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return `${base}${requestType}`;
}

/** Standard Bearer auth header. */
export function bearerAuthHeader(
  apiKey: string | undefined
): Record<string, string> {
  if (!apiKey) return {};
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Extract headers listed in config.forwardHeaders from the incoming request.
 * Returns only the headers that are actually present.
 */
export function extractForwardHeaders(
  config: ProviderConfig,
  request: Request
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!config.forwardHeaders) return result;
  for (const name of config.forwardHeaders) {
    const value = request.headers.get(name);
    if (value != null) {
      result[name] = value;
    }
  }
  return result;
}
