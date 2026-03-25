import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';
import {
  createDataLayer,
  validateLLMOpsConfig,
  type ValidatedLLMOpsConfig,
} from '@llmops/core';
import { createEnvValidatorMiddleware } from '@server/middlewares/env';
import { createMigrationMiddleware } from '@server/middlewares/migration';
import { createStaticAssetMiddleware } from '@server/middlewares/static-assets';

const setConfigMiddleware = (
  config: ValidatedLLMOpsConfig,
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
 * Resolve the first TelemetryStore from the config's telemetry option.
 * Accepts a single store or an array.
 */
function resolveTelemetryStore(telemetry: unknown) {
  if (!telemetry) return null;
  if (Array.isArray(telemetry)) return telemetry[0] ?? null;
  return telemetry;
}

/**
 * Middleware that wires up telemetry store and remaining datalayer.
 */
const createTelemetryMiddleware = (
  validatedConfig: ValidatedLLMOpsConfig,
): MiddlewareHandler => {
  return async (c, next) => {
    const store = resolveTelemetryStore(validatedConfig.telemetry);

    if (store && store._db) {
      // Telemetry store available — set it and create remaining datalayer from its Kysely instance
      c.set('telemetryStore', store);
      c.set('db', createDataLayer(store._db));
      c.set('kyselyDb', store._db);
      c.set('dbType', 'postgres');
    } else {
      // Inline-only mode: no telemetry, no database
      c.set('telemetryStore', null);
      c.set('db', null);
      c.set('kyselyDb', null);
      c.set('dbType', null);
    }
    await next();
  };
};

export const createApp = (config?: LLMOpsConfig) => {
  // Validate the config immediately, this will throw and panic if invalid
  const validatedConfig = validateLLMOpsConfig(config);

  const store = resolveTelemetryStore(validatedConfig.telemetry);

  const app = new Hono()
    // Static assets must be served BEFORE any heavy middlewares
    .use('/assets/*', createStaticAssetMiddleware())
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig));

  // Run migrations if we have a telemetry store with a db
  if (store && store._db) {
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
