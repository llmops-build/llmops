import type { ProviderAdapter } from './providers/types';
import { err, ok, type Result } from './result';
import type { ProviderConfig } from './types/provider';
import type { RequestType } from './types/requests';
import { type GatewayError, serverError } from './utils/responses';

/**
 * Build the upstream request from the adapter + config, send it, and return the
 * response. Pass-through by default: the (model-rewritten) body is forwarded and
 * the upstream response — stream included — is returned as-is.
 */
export async function executeRequest(
  adapter: ProviderAdapter,
  config: ProviderConfig,
  requestType: RequestType,
  request: Request,
  body: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<Result<Response, GatewayError>> {
  const endpoint = adapter.endpoints[requestType];
  if (!endpoint) {
    return err({
      status: 404,
      type: 'not_found_error',
      message: `Provider "${adapter.name}" does not support ${requestType}.`,
    });
  }

  const url = endpoint.getURL(config, requestType);
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...endpoint.getHeaders(config, request),
  };

  try {
    const upstream = await fetchImpl(url, {
      method: request.method,
      headers,
      body,
    });
    return ok(upstream);
  } catch (error) {
    return serverError(
      error instanceof Error ? error.message : 'Upstream request failed.',
    );
  }
}
