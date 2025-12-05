import { Hono, type MiddlewareHandler } from 'hono';
import mainApp from './server';
import type { LLMOpsConfig } from '@llmops/core';

const setBasePathMiddleware = (basePath: string): MiddlewareHandler => {
  return async (c, next) => {
    c.set('basePath', basePath);
    await next();
  };
};

export const createApp = (config: LLMOpsConfig) => {
  let app;
  if (config.basePath) {
    app = new Hono()
      .use('*', setBasePathMiddleware(config.basePath))
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
