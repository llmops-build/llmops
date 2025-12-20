import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { requestHeadersSchema } from './requestValidator';

export const createRequestGuardMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const headers = await requestHeadersSchema.safeParseAsync(c.req.header());
    if (headers.success) {
      const envSec = headers.data['x-llmops-environment'];
      if (!envSec) {
        // No environment ID - enforce same origin (CORS)
        const origin = c.req.header('origin');
        const host = c.req.header('host');

        // If there's an origin header, it must match the host (same origin)
        if (origin) {
          const originUrl = new URL(origin);
          const hostWithoutPort = host?.split(':')[0];
          const originHost = originUrl.hostname;

          if (originHost !== hostWithoutPort && originHost !== host) {
            return c.json(
              {
                message: 'Cross-origin requests require an environment ID',
              },
              403
            );
          }
        }

        c.set('configId', headers['data']['x-llmops-config'])
        c.set('envSec', headers['data']['x-llmops-environment'])

        await next();
      } else {
        // Environment ID present - allow cross-origin requests via CORS
        const corsMiddleware = cors({
          origin: '*',
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowHeaders: [
            'Content-Type',
            'Authorization',
            'x-llmops-config',
            'x-llmops-environment',
          ],
        });
        await corsMiddleware(c, next);
      }
    } else {
      /**
       * @todo Refactor this to give OpenAI specific response.
       */
      return c.json(
        {
          message: 'Invalid request headers',
        },
        400
      );
    }
  };
};
