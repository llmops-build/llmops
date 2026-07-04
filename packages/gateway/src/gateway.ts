import { executeRequest } from './execute';
import { parseModel, resolveTarget } from './resolve';
import { matchRoute } from './router';
import type { GatewayConfig, ProviderInput } from './types/config';
import { errorResponse } from './utils/responses';

/** The in-process gateway handler — a plug you mount, not a proxy you route to. */
export type GatewayHandler = (req: Request) => Promise<Response>;

/**
 * Create the gateway plug.
 *
 * Routes an OpenAI-shaped request (`@provider-slug/model` in the body) to the
 * configured provider and streams the response straight back — pass-through by
 * default. Non-OpenAI-compliant providers plug in via `config.adapters`.
 */
export function createGateway(config: GatewayConfig = {}): GatewayHandler {
  const providers = new Map<string, ProviderInput>(
    (config.providers ?? []).map((p) => [p.slug, p]),
  );
  const fetchImpl = config.fetch ?? globalThis.fetch;

  return async (req) => {
    const pathname = new URL(req.url).pathname;
    const requestType = matchRoute(pathname);
    if (!requestType) {
      return errorResponse({
        status: 404,
        type: 'not_found_error',
        message: `No route for ${pathname}.`,
      });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse({
        status: 400,
        type: 'invalid_request_error',
        message: 'Request body must be valid JSON.',
      });
    }

    const parsed = parseModel(payload.model);
    if (!parsed.ok) return errorResponse(parsed.error);

    const resolved = resolveTarget(
      parsed.value.slug,
      parsed.value.model,
      providers,
      config.adapters,
    );
    if (!resolved.ok) return errorResponse(resolved.error);

    // Strip the `@slug/` prefix so the upstream sees its own bare model id.
    const body = JSON.stringify({ ...payload, model: parsed.value.model });

    const result = await executeRequest(
      resolved.value.adapter,
      resolved.value.config,
      requestType,
      req,
      body,
      fetchImpl,
    );
    return result.ok ? result.value : errorResponse(result.error);
  };
}
