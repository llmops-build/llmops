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
 */
export const createAuthClientMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const kyselyDb = c.get('kyselyDb');
    const dbType = c.get('dbType');

    // Create workspace settings data layer for the onUserCreated hook
    const workspaceSettings = createWorkspaceSettingsDataLayer(kyselyDb);

    // Pass the pre-configured Kysely instance to Better Auth
    // This ensures it uses the correct schema (search_path)
    const authClient = betterAuth(
      getAuthClientOptions({
        database: {
          db: kyselyDb,
          type: dbType,
        },
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
