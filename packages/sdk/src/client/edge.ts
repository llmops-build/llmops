/**
 * @file src/client/edge.ts
 * Edge-compatible LLMOps client for serverless/edge runtimes (Convex, Cloudflare Workers, etc.)
 */

import { Hono, type MiddlewareHandler } from 'hono';
import {
  type LLMOpsConfig,
  createDataLayer,
  validateLLMOpsConfig,
  type ValidatedLLMOpsConfig,
} from '@llmops/core';
import {
  createDatabaseFromConnection,
  detectDatabaseType,
} from '@llmops/core/db';

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
};

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    await next();
  };
};

const createDatabaseMiddleware = (
  validatedConfig: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    const kyselyDb = await createDatabaseFromConnection(
      validatedConfig.database,
      {
        schema: validatedConfig.schema,
      }
    );
    if (!kyselyDb) {
      throw new Error('Failed to create database connection');
    }

    const dbType = detectDatabaseType(validatedConfig.database);
    if (!dbType) {
      throw new Error('Failed to detect database type');
    }

    const dataLayer = await createDataLayer(kyselyDb);
    c.set('db', dataLayer);
    c.set('kyselyDb', kyselyDb);
    c.set('dbType', dbType);

    const setupComplete = await dataLayer.isSetupComplete();
    c.set('setupComplete', setupComplete);

    await next();
  };
};

/**
 * Creates an edge-compatible LLMOps client (API only, no static assets or SSR)
 *
 * Use this for serverless/edge environments like:
 * - Convex
 * - Cloudflare Workers
 * - Vercel Edge Functions
 * - Deno Deploy
 *
 * IMPORTANT: Run migrations separately before deploying.
 * Use the CLI: `npx @llmops/cli migrate`
 */
export const createLLMOpsEdge = (config: LLMOpsConfig): LLMOpsClient => {
  const validatedConfig = validateLLMOpsConfig(config);

  // Minimal edge-compatible app with just the API endpoints
  // Import API handlers dynamically to avoid pulling in Node.js dependencies
  const app = new Hono()
    .get('/health', (c) => c.json({ status: 'ok' }))
    .use('*', setConfigMiddleware(validatedConfig))
    .use('*', createDatabaseMiddleware(validatedConfig))
    .basePath(validatedConfig.basePath);

  return {
    handler: async (req: Request) => app.fetch(req, undefined, undefined),
    config: Object.freeze(config),
  };
};
