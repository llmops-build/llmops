import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';

const setConfigMiddleware = (config: LLMOpsConfig): MiddlewareHandler => {
  return async (c, next) => {
    c.set('llmopsConfig', config);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  let app;
  if (config.basePath) {
    app = new Hono()
      .use('*', setConfigMiddleware(config))
      .route('/', mainApp)
      .basePath(config.basePath);
  } else {
    throw new Error('Base path is required in LLMOpsConfig');
  }
  return {
    app,
  };
};

export default mainApp;
