import type { MiddlewareHandler } from 'hono';
import { betterAuth } from 'better-auth';
import { getAuthClientOptions, type LLMOpsConfig } from '@llmops/core';

export const createAuthClientMiddleware = (
  config: LLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    const authClient = betterAuth(getAuthClientOptions(config.database));
    c.set('authClient', authClient);
    await next();
  };
};
