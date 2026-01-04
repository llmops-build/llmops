import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import {
  createDataLayer,
  validateLLMOpsConfig,
  type ValidatedLLMOpsConfig,
} from '@llmops/core';
import { createDatabaseFromConnection } from '@llmops/core/db';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';
import { createSeedMiddleware } from '@server/middlewares/seed';
import { createMigrationMiddleware } from '@server/middlewares/migration';
import type { LLMProvider } from '@server/types';
import { createAuthClientMiddleware } from '@server/middlewares/auth';

const MODELS_DEV_LOGOS = 'https://models.dev/logos';

/**
 * Convert provider key to display name
 * e.g., 'openai' -> 'OpenAI', 'azure-openai' -> 'Azure OpenAI'
 */
function getProviderDisplayName(key: string): string {
  return key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    const db = await createDatabaseFromConnection(validatedConfig.database, {
      schema: validatedConfig.schema,
    });
    if (!db) {
      throw new Error('Failed to create database connection');
    }
    const dataLayer = await createDataLayer(db);
    c.set('db', dataLayer);

    // Check if setup is complete and set it in context
    const setupComplete = await dataLayer.isSetupComplete();
    c.set('setupComplete', setupComplete);

    await next();
  };
};

/**
 * Create middleware that sets llmProviders from config
 * Provider metadata (name, logo) comes from models.dev
 */
const createLLMProvidersMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  // Build providers list once at startup
  const providers = config.providers || {};
  const llmProviders: LLMProvider[] = Object.keys(providers).map((key) => ({
    key,
    name: getProviderDisplayName(key),
    imageURI: `${MODELS_DEV_LOGOS}/${key}.svg`,
  }));

  return async (c, next) => {
    c.set('llmProviders', llmProviders);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig))
    // Migration runs BEFORE database/seed to ensure tables exist
    .use('*', createMigrationMiddleware(validatedConfig))
    .use('*', createDatabaseMiddleware(validatedConfig))
    .use('*', createSeedMiddleware())
    .use('*', createLLMProvidersMiddleware(validatedConfig))
    .use('*', createAuthClientMiddleware(validatedConfig))
    .route('/', mainApp)
    .basePath(validatedConfig.basePath);

  return {
    app,
  };
};

export default mainApp;
