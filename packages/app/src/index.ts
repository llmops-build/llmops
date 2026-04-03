import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import { validateLLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';
import { createMigrationMiddleware } from '@server/middlewares/migration';
import { createStaticAssetMiddleware } from '@server/middlewares/static-assets';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig,
): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    if (config.providers) {
      c.set('inlineProviders', config.providers);
    }
    await next();
  };
};

/**
 * Resolve the first TelemetryStore from the config's telemetry option.
 */
function resolveTelemetryStore(telemetry: unknown) {
  if (!telemetry) return null;
  if (Array.isArray(telemetry)) return telemetry[0] ?? null;
  return telemetry;
}

/**
 * Middleware that wires up telemetry store.
 */
const createTelemetryMiddleware = (
  validatedConfig: ValidatedLLMOpsConfig,
): MiddlewareHandler => {
  return async (c, next) => {
    const store = resolveTelemetryStore(validatedConfig.telemetry);
    c.set('telemetryStore', store ?? null);
    await next();
  };
};

export const createApp = (config?: LLMOpsConfig) => {
  const validatedConfig = validateLLMOpsConfig(config);
  const store = resolveTelemetryStore(validatedConfig.telemetry);

  const app = new Hono()
    .use('/assets/*', createStaticAssetMiddleware())
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig));

  if (store && store._pool) {
    app.use('*', createMigrationMiddleware(validatedConfig));
  }

  app.use('*', createTelemetryMiddleware(validatedConfig));
  app.route('/', mainApp).basePath(validatedConfig.basePath);

  return {
    app,
    config: validatedConfig,
  };
};

export default mainApp;
