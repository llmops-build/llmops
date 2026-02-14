import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import v1 from '@server/handlers/v1';
import genaiV1 from '@server/handlers/genai';
import otlp from '@server/handlers/otlp';
import authHandlers from '@server/handlers/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const app = new Hono<{ Variables: { user: any; session: any } }>();

/**
 * Error response for routes that require database in inline-only mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const databaseRequiredError = (c: Context<any, any, any>) => {
  return c.json(
    {
      error: {
        message:
          'This endpoint requires a database. ' +
          'Configure a database to use dashboard API and auth features.',
        type: 'configuration_error',
      },
    },
    503
  );
};

export const routes = app
  // Block auth routes if no database (inline-only mode)
  .use('/auth/*', async (c, next) => {
    const authClient = c.get('authClient');
    if (!authClient) {
      return databaseRequiredError(c);
    }
    await next();
  })
  // Block v1 API routes if no database (inline-only mode)
  .use('/v1/*', async (c, next) => {
    const db = c.var.db;
    if (!db) {
      return databaseRequiredError(c);
    }
    await next();
  })
  // Block signup if setup is already complete (single user mode)
  .post('/auth/sign-up/*', async (c, next) => {
    const setupComplete = c.get('setupComplete');
    if (setupComplete) {
      throw new HTTPException(403, {
        message: 'Registration is disabled. Only one user is allowed.',
      });
    }
    await next();
  })
  // Auth routes handled by better-auth
  .on(['POST', 'GET'], '/auth/*', (c) => {
    return c.get('authClient')!.handler(c.req.raw);
  })
  // Setup status endpoint (no auth required)
  .route('/auth', authHandlers)
  // Session middleware for all other routes
  .use('*', async (c, next) => {
    const authClient = c.get('authClient');
    if (!authClient) {
      // Inline-only mode: no auth
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }
    const session = await authClient.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }
    c.set('user', session.user);
    c.set('session', session.session);
    await next();
  })
  .route('/genai', genaiV1)
  .route('/otlp', otlp)
  .route('/v1', v1);

export default app;
