import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import { type LLMOpsConfig, type TelemetrySink } from '@llmops/core';
import { validateLLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import {
  createStoreSink,
  noopSink,
  type TelemetryStore,
} from '@llmops/sdk';
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
function resolveTelemetryStore(telemetry: unknown): TelemetryStore | null {
  if (!telemetry) return null;
  if (Array.isArray(telemetry)) return (telemetry[0] as TelemetryStore) ?? null;
  return telemetry as TelemetryStore;
}

/**
 * Middleware that wires up telemetry store + sink on every request context.
 */
const createTelemetryMiddleware = (
  sink: TelemetrySink,
  validatedConfig: ValidatedLLMOpsConfig,
): MiddlewareHandler => {
  return async (c, next) => {
    const store = resolveTelemetryStore(validatedConfig.telemetry);
    c.set('telemetryStore', store);
    c.set('telemetrySink', sink);
    await next();
  };
};

export const createApp = (config?: LLMOpsConfig) => {
  const validatedConfig = validateLLMOpsConfig(config);
  const store = resolveTelemetryStore(validatedConfig.telemetry);

  // Build the TelemetrySink ONCE from the configured store. The gateway emits
  // llm_request events here; the sink batches + flushes (interval on Node,
  // waitUntil on edge). When no store is configured, a no-op sink keeps the
  // gateway a pure proxy — zero added latency, zero runtime cost.
  const sink: TelemetrySink = store
    ? createStoreSink(store, {
        flushIntervalMs: 2000,
        waitUntil: validatedConfig.waitUntil,
      })
    : noopSink;

  const app = new Hono()
    .use('/assets/*', createStaticAssetMiddleware())
    .use('*', createEnvValidatorMiddleware())
    .use('*', setConfigMiddleware(validatedConfig));

  // Auto-migration middleware. It gracefully no-ops when the configured store
  // is not pg-backed (no `_pool`), so mount it once and let the middleware be
  // the sole authority on whether migration runs.
  app.use('*', createMigrationMiddleware(validatedConfig));
  app.use('*', createTelemetryMiddleware(sink, validatedConfig));
  app.route('/', mainApp).basePath(validatedConfig.basePath);

  return {
    app,
    config: validatedConfig,
  };
};

export default mainApp;
