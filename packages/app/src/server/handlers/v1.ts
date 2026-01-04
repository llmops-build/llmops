import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import analytics from '@server/handlers/analytics';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';

import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';
import workspaceSettings from '@server/handlers/workspace-settings';
import type { AuthConfig, BasicAuthConfig } from '@llmops/core';

/**
 * Type guard to check if auth config is basic auth
 */
function isBasicAuth(auth: AuthConfig): auth is BasicAuthConfig {
  return auth.type === 'basic';
}

const app = new Hono()
  .use('*', async (c, next) => {
    // Check if auth was already handled by enterprise middleware
    // Auth Middleware - handles basic auth (open source)
    const config = c.get('llmopsConfig');

    if (isBasicAuth(config.auth)) {
      const handler = basicAuth({
        username: config.auth.defaultUser,
        password: config.auth.defaultPassword,
      });
      return handler(c, next);
    }

    // Unknown auth type without enterprise middleware
    // This means user configured an enterprise auth type but didn't add enterprise middleware
    return c.json(
      {
        error: 'Auth middleware not configured',
        message:
          `Auth type "${config.auth.type}" requires @llmops/enterprise middleware. ` +
          `Either use basicAuth() from @llmops/sdk or install @llmops/enterprise and add the auth middleware.`,
      },
      501
    );
  })
  .route('/analytics', analytics)
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants)
  .route('/workspace-settings', workspaceSettings);

export default app;
