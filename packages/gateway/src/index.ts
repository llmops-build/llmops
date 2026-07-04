// @llmops/gateway — a plug, not a proxy.
//
// A pure `(req: Request) => Promise<Response>` handler you mount in-process.
// OpenAI-compatible by default: it routes `@provider-slug/model` requests to the
// configured provider and streams the response straight back (pass-through).
// Providers that diverge from OpenAI plug in via custom adapters.

export { createGateway, type GatewayHandler } from './gateway';
export type { GatewayConfig, ProviderInput } from './types/config';

// Routing + resolution (exported for testing / advanced composition).
export { executeRequest } from './execute';
export { parseModel, type ResolvedTarget, resolveTarget } from './resolve';
export { matchRoute } from './router';

// Providers.
export { openaiCompatible } from './providers/openai-compatible';
export { DEFAULT_BASE_URLS, getAdapter } from './providers/registry';

// Foundation.
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
