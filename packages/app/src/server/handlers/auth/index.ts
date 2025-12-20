import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';
import type { MiddlewareHandler } from 'hono';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
  setSessionCookie,
  clearSessionCookie,
  createAuthMiddleware,
  isBasicAuth,
} from '@server/middlewares/auth';

/**
 * Middleware that ensures basic auth is enabled.
 * Returns 404 if auth is not configured or not using basic auth.
 */
const requireBasicAuth: MiddlewareHandler = async (c, next) => {
  const config = c.get('llmopsConfig');

  if (!isBasicAuth(config.auth)) {
    return c.json(
      clientErrorResponse('Auth endpoints not available', 404),
      404
    );
  }

  await next();
};

const app = new Hono()
  // Apply basic auth guard to all routes
  .use('*', requireBasicAuth)

  /**
   * POST /login - Authenticate user and create session
   */
  .post(
    '/login',
    zv(
      'json',
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const config = c.get('llmopsConfig');
      const { email, password } = c.req.valid('json');

      try {
        // Find user by email
        const user = await db.getUserByEmail({ email });

        if (!user) {
          return c.json(
            clientErrorResponse('Invalid email or password', 401),
            401
          );
        }

        // Check if user is active
        if (!user.isActive) {
          return c.json(
            clientErrorResponse('User account is disabled', 401),
            401
          );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return c.json(
            clientErrorResponse('Invalid email or password', 401),
            401
          );
        }

        // Create session
        const sessionToken = generateSessionToken();
        const hashedToken = hashSessionToken(sessionToken);
        // Get session expiry from config (isBasicAuth guard ensures config.auth is basic type)
        const authConfig = config.auth as { sessionExpiryHours: number };
        const sessionExpiryHours = authConfig.sessionExpiryHours;
        const expiresAt = new Date(
          Date.now() + sessionExpiryHours * 60 * 60 * 1000
        );

        const session = await db.createSession({
          userId: user.id,
          token: hashedToken,
          expiresAt,
          userAgent: c.req.header('user-agent'),
          ipAddress:
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            undefined,
        });

        if (!session) {
          return c.json(
            internalServerError('Failed to create session', 500),
            500
          );
        }

        // Update last login
        await db.updateLastLogin(user.id);

        // Set session cookie
        setSessionCookie(c, sessionToken, expiresAt);

        return c.json(
          successResponse(
            {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              expiresAt: expiresAt.toISOString(),
            },
            200
          )
        );
      } catch (error) {
        console.error('Login error:', error);
        return c.json(internalServerError('Login failed', 500), 500);
      }
    }
  )

  /**
   * POST /logout - End current session
   */
  .post('/logout', createAuthMiddleware(), async (c) => {
    const db = c.get('db');
    const auth = c.get('auth');

    try {
      if (auth) {
        await db.deleteSessionByToken({ token: auth.session.token });
      }
      clearSessionCookie(c);

      return c.json(
        successResponse({ message: 'Logged out successfully' }, 200)
      );
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear cookie even if DB operation fails
      clearSessionCookie(c);
      return c.json(successResponse({ message: 'Logged out' }, 200));
    }
  })

  /**
   * POST /logout-all - End all sessions for current user
   */
  .post('/logout-all', createAuthMiddleware(), async (c) => {
    const db = c.get('db');
    const auth = c.get('auth')!;

    try {
      const count = await db.deleteUserSessions({ userId: auth.user.id });
      clearSessionCookie(c);

      return c.json(
        successResponse({ message: `Logged out from ${count} sessions` }, 200)
      );
    } catch (error) {
      console.error('Logout all error:', error);
      clearSessionCookie(c);
      return c.json(
        internalServerError('Failed to logout from all sessions', 500),
        500
      );
    }
  })

  /**
   * GET /me - Get current user info
   */
  .get('/me', createAuthMiddleware(), async (c) => {
    const auth = c.get('auth')!;

    return c.json(
      successResponse(
        {
          user: auth.user,
          session: {
            expiresAt: auth.session.expiresAt.toISOString(),
          },
        },
        200
      )
    );
  })

  /**
   * GET /session - Check if session is valid (lighter than /me)
   */
  .get('/session', async (c) => {
    const db = c.get('db');
    const { getCookie } = await import('hono/cookie');
    const { SESSION_COOKIE_NAME, hashSessionToken } =
      await import('@server/middlewares/auth');

    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      return c.json(successResponse({ authenticated: false }, 200));
    }

    const hashedToken = hashSessionToken(sessionToken);
    const session = await db.getSessionByToken({ token: hashedToken });

    if (!session) {
      return c.json(successResponse({ authenticated: false }, 200));
    }

    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      return c.json(successResponse({ authenticated: false }, 200));
    }

    return c.json(
      successResponse(
        {
          authenticated: true,
          expiresAt: expiresAt.toISOString(),
        },
        200
      )
    );
  })

  /**
   * PATCH /password - Change password for current user
   */
  .patch(
    '/password',
    createAuthMiddleware(),
    zv(
      'json',
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const auth = c.get('auth')!;
      const { currentPassword, newPassword } = c.req.valid('json');

      try {
        const user = await db.getUserById({ userId: auth.user.id });
        if (!user) {
          return c.json(clientErrorResponse('User not found', 404), 404);
        }

        // Verify current password
        const isValid = await verifyPassword(
          currentPassword,
          user.passwordHash
        );
        if (!isValid) {
          return c.json(
            clientErrorResponse('Current password is incorrect', 400),
            400
          );
        }

        // Hash new password and update
        const newPasswordHash = await hashPassword(newPassword);
        await db.updateUserPassword(auth.user.id, newPasswordHash);

        return c.json(
          successResponse({ message: 'Password updated successfully' }, 200)
        );
      } catch (error) {
        console.error('Password change error:', error);
        return c.json(
          internalServerError('Failed to update password', 500),
          500
        );
      }
    }
  );

export default app;
