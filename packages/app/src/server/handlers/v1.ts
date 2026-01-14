import { Hono } from 'hono';
import analytics from '@server/handlers/analytics';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';

import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';
import workspaceSettings from '@server/handlers/workspace-settings';
import playgrounds from '@server/handlers/playgrounds';
import { verifySuperAdmin } from '@server/middlewares/verifySession';

const app = new Hono()
  // Verify user is authenticated AND is the super admin
  .use('*', verifySuperAdmin)
  .route('/analytics', analytics)
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants)
  .route('/workspace-settings', workspaceSettings)
  .route('/playgrounds', playgrounds);

export default app;
