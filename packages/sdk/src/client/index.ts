import { type LLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';
import type { AuthClient } from '../lib/auth';
import { BasicAuthClient } from '../lib/auth';

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
  /**
   * Auth client for managing authentication
   *
   * For basic auth (open source):
   * - isAuthenticated(), hasPermission() work
   * - User management methods throw AuthFeatureNotAvailableError
   *
   * For enterprise auth:
   * - All methods available (user CRUD, RBAC, sessions, banning)
   */
  authClient: AuthClient;
};

/**
 * Create an auth client based on the auth config type
 */
function createAuthClient(auth: LLMOpsConfig['auth']): AuthClient {
  if (
    auth.type === 'basic' &&
    typeof auth.defaultUser === 'string' &&
    typeof auth.defaultPassword === 'string'
  ) {
    return new BasicAuthClient({
      type: 'basic',
      defaultUser: auth.defaultUser,
      defaultPassword: auth.defaultPassword,
    });
  }

  // For unknown auth types, throw an error
  // Enterprise auth types should be handled by @llmops/enterprise
  throw new Error(
    `Unknown auth type "${auth.type}". ` +
      `Use basicAuth() from @llmops/sdk or upgrade to @llmops/enterprise for advanced auth.`
  );
}

export const createLLMOps = (config: LLMOpsConfig): LLMOpsClient => {
  const { app } = createApp(config);
  const authClient = createAuthClient(config.auth);

  return {
    handler: async (req: Request) => app.fetch(req, undefined, undefined),
    config: Object.freeze(config),
    authClient,
  };
};
