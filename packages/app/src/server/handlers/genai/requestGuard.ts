import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import {
  requestHeadersSchema,
  extractEnvSecretFromAuth,
} from './requestValidator';

export const createRequestGuardMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const headers = await requestHeadersSchema.safeParseAsync(c.req.header());
    if (!headers.success) {
      /**
       * @todo Refactor this to give OpenAI specific response.
       */
      return c.json(
        {
          message: 'Invalid request headers',
          errors: headers.error.flatten().fieldErrors,
        },
        400
      );
    }

    // Extract environment secret from Authorization header (Bearer token)
    // Users pass it via OpenAI's apiKey option: new OpenAI({ apiKey: 'env-secret' })
    let envSec: string;
    try {
      envSec = extractEnvSecretFromAuth(headers.data['authorization']);
    } catch (error) {
      return c.json(
        {
          message:
            error instanceof Error ? error.message : 'Invalid authorization',
        },
        401
      );
    }

    const configId =
      headers.data['x-llmops-config'] || headers.data['x-llmops-prompt'];

    if (!configId) {
      return c.json(
        {
          message: 'Config ID is required',
          error: 'Either x-llmops-config or x-llmops-prompt must be provided',
        },
        400
      );
    }

    c.set('configId', configId);
    c.set('envSec', envSec);

    // Allow cross-origin requests via CORS
    const corsMiddleware = cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'x-llmops-config',
        'x-llmops-prompt',
      ],
    });
    await corsMiddleware(c, next);
  };
};
