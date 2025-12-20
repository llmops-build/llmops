import { Hono } from 'hono';
import auth from '@server/handlers/auth';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';
import genaiV1 from '@server/handlers/genai';
import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';
import { createAuthMiddleware } from '@server/middlewares/auth';

// Auth middleware for protected routes
const authMiddleware = createAuthMiddleware();

// Create a sub-app for protected dashboard routes
const protectedRoutes = new Hono()
  .use('*', authMiddleware)
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants);

const app = new Hono()
  // Auth routes (login/logout) - no auth required
  .route('/auth', auth)
  // GenAI routes - uses its own API key authentication
  .route('/genai', genaiV1)
  // Protected dashboard routes - require session auth
  .route('/', protectedRoutes);

export default app;
