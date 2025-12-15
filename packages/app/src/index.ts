import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import { validateLLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import {
  createKyselyAdapter,
  kyselyAdapter,
} from '@llmops/core/adapters/kysely-adapter';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    await next();
  };
};

const createKyselyAdapterMiddleware = (
  validatedConfig: LLMOpsConfig
): MiddlewareHandler => {
  return async (c, next) => {
    const { kysely, databaseType, transaction } =
      await createKyselyAdapter(validatedConfig);
    const adapter = kyselyAdapter(kysely, {
      type: databaseType,
      transaction,
    });
    const a = adapter(validatedConfig);
    c.set('db', a);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const app = new Hono()
    .use('*', createEnvValidatorMiddleware())
    .use('*', createKyselyAdapterMiddleware(validatedConfig))
    .use('*', setConfigMiddleware(validatedConfig))
    .route('/', mainApp)
    .basePath(validatedConfig.basePath);

  return {
    app,
  };
};

export default mainApp;
