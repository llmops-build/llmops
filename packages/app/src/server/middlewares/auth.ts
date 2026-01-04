import type { MiddlewareHandler } from 'hono';
import { betterAuth } from 'better-auth';
import { getAuthClientOptions } from '@llmops/core';

/**
 * Creates auth client middleware that uses the pre-configured Kysely instance
 * from context. This ensures Better Auth uses the same database connection
 * with the correct schema (search_path) configuration.
 */
export const createAuthClientMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const kyselyDb = c.get('kyselyDb');
    const dbType = c.get('dbType');

    // Pass the pre-configured Kysely instance to Better Auth
    // This ensures it uses the correct schema (search_path)
    const authClient = betterAuth(
      getAuthClientOptions({
        db: kyselyDb,
        type: dbType,
      })
    );
    c.set('authClient', authClient);
    await next();
  };
};
