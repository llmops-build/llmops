import type { MiddlewareHandler } from 'hono';
import { betterAuth } from 'better-auth';
import {
  getAuthClientOptions,
  createWorkspaceSettingsDataLayer,
} from '@llmops/core';

/**
 * Creates auth client middleware that uses the pre-configured Kysely instance
 * from context. This ensures Better Auth uses the same database connection
 * with the correct schema (search_path) configuration.
 *
 * Only initializes the auth client for /api/* routes where it's actually needed.
 *
 * Origin validation:
 * - Local dev: Works automatically via baseURL derived from request
 * - Production: Set AUTH_TRUSTED_ORIGINS env var (comma-separated)
 *   e.g., AUTH_TRUSTED_ORIGINS=https://myapp.railway.app,https://myapp.com
 */
export const createAuthClientMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    // Skip auth client initialization for non-API routes
    if (!c.req.path.startsWith('/api')) {
      await next();
      return;
    }

    const kyselyDb = c.get('kyselyDb');
    const dbType = c.get('dbType');

    // Create workspace settings data layer for the onUserCreated hook
    const workspaceSettings = createWorkspaceSettingsDataLayer(kyselyDb);

    // Derive baseURL from request - works for local dev (http://localhost:3000)
    // For production behind proxies, this may return internal URL, so we also
    // support AUTH_TRUSTED_ORIGINS env var for explicit trusted origins
    const url = new URL(c.req.url);
    const baseURL = `${url.protocol}//${url.host}`;

    // Get additional trusted origins from environment variable (comma-separated)
    const trustedOriginsEnv = process.env.AUTH_TRUSTED_ORIGINS;
    const trustedOrigins = trustedOriginsEnv
      ? trustedOriginsEnv.split(',').map((origin) => origin.trim())
      : [];

    // Pass the pre-configured Kysely instance to Better Auth
    // This ensures it uses the correct schema (search_path)
    const authClient = betterAuth(
      getAuthClientOptions({
        database: {
          db: kyselyDb,
          type: dbType,
        },
        baseURL,
        trustedOrigins,
        onUserCreated: async (userId: string) => {
          // Set the first user as super admin and mark setup complete
          await workspaceSettings.setSuperAdminId(userId);
          await workspaceSettings.markSetupComplete();
        },
      })
    );
    c.set('authClient', authClient);
    await next();
  };
};
