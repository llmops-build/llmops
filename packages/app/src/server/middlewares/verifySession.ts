import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Middleware that verifies a valid session exists.
 * Must be used after the auth client middleware has set user/session in context.
 *
 * @throws HTTPException 401 if no valid session exists
 */
export const verifySession: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');
  const session = c.get('session');

  if (!user || !session) {
    throw new HTTPException(401, {
      message: 'Unauthorized - valid session required',
    });
  }

  await next();
};
