import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
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
import { createSeedMiddleware } from '@server/middlewares/seed';
import { createMigrationMiddleware } from '@server/middlewares/migration';
import { createAuthClientMiddleware } from '@server/middlewares/auth';
import { createStaticAssetMiddleware } from '@server/middlewares/static-assets';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    // Set inline providers if configured
    if (config.providers) {
      c.set('inlineProviders', config.providers);
    }
    await next();
  };
};

/**
 * Middleware for inline-only mode (no database configured).
 * Sets null values for database-related context variables.
 */
const createInlineOnlyMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    c.set('db', null);
    c.set('kyselyDb', null);
    c.set('dbType', null);
    c.set('authClient', null);
    c.set('setupComplete', true); // No setup needed for inline-only mode
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

    // Detect database type
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

export const createApp = (config?: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    // Static assets must be served BEFORE any database/auth middlewares
    // to avoid running heavy initialization for asset requests
    .use('/assets/*', createStaticAssetMiddleware())
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig));

  // Only add database-dependent middlewares if database is configured
  if (validatedConfig.database) {
    // Migration runs BEFORE database/seed to ensure tables exist
    app
      .use('*', createMigrationMiddleware(validatedConfig))
      .use('*', createDatabaseMiddleware(validatedConfig))
      .use('*', createSeedMiddleware())
      .use('*', createAuthClientMiddleware());
  } else {
    // Inline-only mode: set null values for database-related context
    app.use('*', createInlineOnlyMiddleware());
  }

  app.route('/', mainApp).basePath(validatedConfig.basePath);

  return {
    app,
    config: validatedConfig,
  };
};

export default mainApp;
