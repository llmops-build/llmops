import { Hono, type ContextVariableMap } from 'hono';
import v1 from '@server/handlers/v1';
import genaiV1 from '@server/handlers/genai';
import authHandlers from '@server/handlers/auth';

const app = new Hono<{
  Variables: {
    user: ContextVariableMap['authClient']['$Infer']['Session']['user'] | null;
    session:
      | ContextVariableMap['authClient']['$Infer']['Session']['session']
      | null;
  };
}>();

export const routes = app
  // Auth routes handled by better-auth
  .on(['POST', 'GET'], '/auth/*', (c) => {
    return c.get('authClient').handler(c.req.raw);
  })
  // Setup status endpoint (no auth required)
  .route('/auth', authHandlers)
  // Session middleware for all other routes
  .use('*', async (c, next) => {
    const session = await c
      .get('authClient')
      .api.getSession({ headers: c.req.raw.headers });
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
  .route('/v1', v1);

export default app;
