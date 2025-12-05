import { Hono } from 'hono';
import v1 from '@server/handlers/v1';
import { createLLMProvidersMiddleware } from '@server/middlewares/providers';

const app = new Hono();

export const routes = app
  .use('*', createLLMProvidersMiddleware())
  .route('/v1', v1);

export default app;
