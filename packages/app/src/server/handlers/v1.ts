import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';

import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';

const app = new Hono()
  .use('*', async (c, next) => {
    // Auth Middleware
    const config = c.get('llmopsConfig');
    const handler = basicAuth({
      username: config.auth.defaultUser,
      password: config.auth.defaultPassword,
    });
    return handler(c, next);
  })
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants);

export default app;
