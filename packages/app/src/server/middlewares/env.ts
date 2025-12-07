import { z } from 'zod';
import { envVariablesSchema } from '@server/lib/env';
import type { MiddlewareHandler } from 'hono';

export const createEnvValidatorMiddleware = (): MiddlewareHandler => {
  let initialized = false;
  return async (c, next) => {
    if (!initialized) {
      const parseResult = envVariablesSchema.safeParse(c.env);
      if (!parseResult.success) {
        console.error(
          'Environment variable validation failed:',
          z.treeifyError(parseResult.error)
        );
        return c.text(
          'Internal Server Error: Invalid environment configuration',
          500
        );
      }
      c.set('env', parseResult.data);
    }
    await next();
  };
};
