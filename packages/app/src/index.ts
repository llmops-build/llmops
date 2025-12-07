import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import { validateLLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig))
    .route('/', mainApp)
    .basePath(validatedConfig.basePath);

  return {
    app,
  };
};

export default mainApp;
