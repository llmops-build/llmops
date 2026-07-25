import { executeRequest } from './execute';
import { instrumentResponse } from './instrument';
import { parseModel, resolveTarget } from './resolve';
import { matchRoute } from './router';
import { resolveGatewayTraceContext } from './trace-context';
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
    const startMs = Date.now();
    const requestId = crypto.randomUUID();
    const trace = resolveGatewayTraceContext(req.headers);
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

    const resolved = await resolveTarget(
      parsed.value.slug,
      parsed.value.model,
      providers,
      {
        getProviderMetadata: config.getProviderMetadata,
        adapters: config.adapters,
      },
    );
    if (!resolved.ok) return errorResponse(resolved.error);

    // Strip the `@slug/` prefix so the upstream sees its own bare model id.
    // When metering a stream, ask OpenAI-compatible providers to include usage
    // in the final SSE chunk so cost can be computed without buffering.
    const rewritten: Record<string, unknown> = {
      ...payload,
      model: parsed.value.model,
    };
    if (config.telemetry && rewritten.stream === true) {
      rewritten.stream_options = {
        ...(rewritten.stream_options as Record<string, unknown> | undefined),
        include_usage: true,
      };
    }
    const body = JSON.stringify(rewritten);

    const result = await executeRequest(
      resolved.value.adapter,
      resolved.value.config,
      requestType,
      req,
      body,
      fetchImpl,
    );
    if (!result.ok) return errorResponse(result.error);
    if (!config.telemetry) return result.value;

    return instrumentResponse(result.value, {
      telemetry: config.telemetry,
      getModelPricing: config.getModelPricing,
      waitUntil: config.waitUntil,
      requestId,
      trace,
      provider: resolved.value.config.provider,
      model: parsed.value.model,
      input: payload,
      startedAt: new Date(startMs).toISOString(),
      startMs,
      isStreaming: rewritten.stream === true,
    });
  };
}
