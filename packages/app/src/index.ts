import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import { validateLLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDatabaseFromConnection } from '@llmops/core/db';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    await next();
  };
};

const createDatabaseMiddleware = (
  validatedConfig: LLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    const db = await createDatabaseFromConnection(validatedConfig.database);
    if (!db) {
      throw new Error('Failed to create database connection');
    }
    c.set('db', db);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    .use('*', createEnvValidatorMiddleware())
    .use('*', createDatabaseMiddleware(validatedConfig))
    .use('*', setConfigMiddleware(validatedConfig))
    .route('/', mainApp)
    .basePath(validatedConfig.basePath);

  return {
    app,
  };
};

export default mainApp;
