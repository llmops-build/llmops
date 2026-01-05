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

// Cache for superAdminId - fetched once from DB, never changes
let cachedSuperAdminId: string | null | undefined = undefined;

/**
 * Middleware that verifies the user is the super admin.
 * Must be used after the auth client middleware has set user/session in context.
 *
 * SuperAdminId is cached in memory since it's set once during setup and never changes.
 *
 * @throws HTTPException 401 if no valid session exists
 * @throws HTTPException 403 if user is not the super admin
 */
export const verifySuperAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');
  const session = c.get('session');

  if (!user || !session) {
    throw new HTTPException(401, {
      message: 'Unauthorized - valid session required',
    });
  }

  // Fetch superAdminId from DB only once, then cache it
  if (cachedSuperAdminId === undefined) {
    const db = c.get('db');
    cachedSuperAdminId = await db.getSuperAdminId();
  }

  // If no superAdminId is set, allow access (setup not complete)
  if (!cachedSuperAdminId) {
    await next();
    return;
  }

  // Verify the user is the super admin
  if (user.id !== cachedSuperAdminId) {
    throw new HTTPException(403, {
      message: 'Forbidden - only the super admin can access this resource',
    });
  }

  await next();
};

/**
 * Clear the cached superAdminId.
 * Call this after setting the superAdminId during setup.
 */
export const clearSuperAdminCache = () => {
  cachedSuperAdminId = undefined;
};
