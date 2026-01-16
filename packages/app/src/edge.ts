/**
 * @file src/edge.ts
 * Edge-compatible app creator for serverless/edge runtimes
 * Does NOT include: static asset serving, SSR, migrations (use separate migration script)
 */

import { Hono, type MiddlewareHandler } from 'hono';
import type { LLMOpsConfig } from '@llmops/core';
import {
  createDataLayer,
  validateLLMOpsConfig,
  type ValidatedLLMOpsConfig,
} from '@llmops/core';
import {
  createDatabaseFromConnection,
  detectDatabaseType,
} from '@llmops/core/db';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';
import { createAuthClientMiddleware } from '@server/middlewares/auth';
import api from '@server/handlers/api';

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

    // Check if setup is complete and set it in context
    const setupComplete = await dataLayer.isSetupComplete();
    c.set('setupComplete', setupComplete);

    await next();
  };
};

/**
 * Creates an edge-compatible LLMOps app (API only, no static assets or SSR)
 *
 * IMPORTANT: Run migrations separately before deploying to edge runtime.
 * Use the CLI: `npx @llmops/cli migrate`
 */
export const createEdgeApp = (config: LLMOpsConfig) => {
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    .get('/health', (c) => c.json({ status: 'ok' }))
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig))
    .use('*', createDatabaseMiddleware(validatedConfig))
    .use('*', createAuthClientMiddleware())
    .route('/api', api)
    .basePath(validatedConfig.basePath);

  return {
    app,
  };
};
