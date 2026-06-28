// @llmops/gateway — a plug, not a proxy.
//
// Step 1 lands the zero-dependency foundation: a hand-rolled Result, the
// ProviderConfig / RequestType types, the ProviderAdapter / EndpointConfig
// contract, header utilities, and OpenAI-compatible error responses.
//
// The gateway implementation (routing, provider resolution, pass-through
// execution, usage/cost + telemetry) lands in the following steps.

export { err, isErr, isOk, ok, type Result } from './result';
export { RequestType } from './types/requests';
export type { ProviderConfig } from './types/provider';
export type { EndpointConfig, ProviderAdapter } from './providers/types';
export {
  bearerAuthHeader,
  defaultURL,
  extractForwardHeaders,
} from './providers/utils';
export {
  authenticationError,
  errorResponse,
  type ErrorType,
  type GatewayError,
  invalidRequest,
  notFound,
  notImplemented,
  rateLimitError,
  serverError,
  successResponse,
} from './utils/responses';

import { errorResponse } from './utils/responses';

/** The in-process gateway handler: a plug you mount, not a proxy you route to. */
export type GatewayHandler = (req: Request) => Promise<Response>;

/**
 * Create the gateway plug.
 *
 * NOT YET IMPLEMENTED — the foundation is in place; routing, provider
 * resolution, pass-through execution, and telemetry land in the next steps.
 * Returns a handler that responds 501 until then.
 */
export function createGateway(): GatewayHandler {
  return async () =>
    errorResponse({
      status: 501,
      type: 'server_error',
      message: 'Gateway not implemented yet (foundation only).',
    });
}
