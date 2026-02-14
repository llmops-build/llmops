import { Hono } from 'hono';
import analytics from '@server/handlers/analytics';
import configs from '@server/handlers/configs';
import datasets from '@server/handlers/datasets';
import environments from '@server/handlers/environments';
import guardrails from '@server/handlers/guardrails';
import playgrounds from '@server/handlers/playgrounds';
import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import traces from '@server/handlers/traces';
import variants from '@server/handlers/variants';
import workspaceSettings from '@server/handlers/workspace-settings';
import { verifySuperAdmin } from '@server/middlewares/verifySession';

const app = new Hono()
  // Verify user is authenticated AND is the super admin
  .use('*', verifySuperAdmin)
  .route('/analytics', analytics)
  .route('/configs', configs)
  .route('/datasets', datasets)
  .route('/environments', environments)
  .route('/guardrails', guardrails)
  .route('/playgrounds', playgrounds)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/traces', traces)
  .route('/variants', variants)
  .route('/workspace-settings', workspaceSettings);

export default app;
