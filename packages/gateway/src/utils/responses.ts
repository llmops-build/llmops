import { err, ok, type Result } from 'neverthrow';

/**
 * OpenAI-compatible error types.
 * @see https://platform.openai.com/docs/guides/error-codes
 */
export type ErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'rate_limit_error'
  | 'server_error';

/**
 * Typed gateway error — handlers return these instead of raw Response objects.
 * Converted to an HTTP response at the boundary in proxyRequest().
 */
export interface GatewayError {
  status: number;
  type: ErrorType;
  message: string;
  param?: string;
  code?: string;
}

/** Shorthand constructors */

export function invalidRequest(message: string): Result<never, GatewayError> {
  return err({ status: 400, type: 'invalid_request_error', message });
}

export function authenticationError(
  message: string
): Result<never, GatewayError> {
  return err({ status: 401, type: 'authentication_error', message });
}

export function notFound(message: string): Result<never, GatewayError> {
  return err({ status: 404, type: 'not_found_error', message });
}

export function rateLimitError(message: string): Result<never, GatewayError> {
  return err({ status: 429, type: 'rate_limit_error', message });
}

export function serverError(message: string): Result<never, GatewayError> {
  return err({ status: 500, type: 'server_error', message });
}

export function notImplemented(provider: string): Result<never, GatewayError> {
  return err({
    status: 501,
    type: 'server_error',
    message: `Provider "${provider}" not yet implemented`,
  });
}

/** Convert a successful Response into an ok Result */
export function successResponse(
  response: Response
): Result<Response, GatewayError> {
  return ok(response);
}

/**
 * Convert a GatewayError to an OpenAI-compatible JSON error response.
 * Called once at the boundary in proxyRequest().
 */
export function errorResponse(error: GatewayError): Response {
  return Response.json(
    {
      error: {
        message: error.message,
        type: error.type,
        ...(error.param && { param: error.param }),
        ...(error.code && { code: error.code }),
      },
    },
    { status: error.status }
  );
}
