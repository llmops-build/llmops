import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';

import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';
import type { AuthConfig, BasicAuthConfig } from '@llmops/core';

/**
 * Type guard to check if auth config is basic auth
 */
function isBasicAuth(auth: AuthConfig): auth is BasicAuthConfig {
  return auth.type === 'basic';
}

const app = new Hono()
  .use('*', async (c, next) => {
    // Auth Middleware - handles basic auth (open source)
    const config = c.get('llmopsConfig');

    if (isBasicAuth(config.auth)) {
      const handler = basicAuth({
        username: config.auth.defaultUser,
        password: config.auth.defaultPassword,
      });
      return handler(c, next);
    }

    // Unknown auth type - this could be an enterprise auth type
    // that should be handled by enterprise middleware
    // For now, reject unknown auth types in open source
    return c.json(
      {
        error: 'Unsupported auth type',
        message: `Auth type "${config.auth.type}" is not supported. Use basicAuth() from @llmops/sdk.`,
      },
      501
    );
  })
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants);

export default app;
