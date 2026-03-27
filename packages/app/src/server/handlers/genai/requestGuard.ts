import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

export const createRequestGuardMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    // Allow cross-origin requests via CORS
    const corsMiddleware = cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    });
    await corsMiddleware(c, next);
  };
};
