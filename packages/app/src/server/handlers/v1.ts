import { Hono } from 'hono';
import analytics from '@server/handlers/analytics';
import datasets from '@server/handlers/datasets';
import guardrails from '@server/handlers/guardrails';
import playgrounds from '@server/handlers/playgrounds';
import providers from '@server/handlers/providers';
import traces from '@server/handlers/traces';
const app = new Hono()
  .route('/analytics', analytics)
  .route('/datasets', datasets)
  .route('/guardrails', guardrails)
  .route('/playgrounds', playgrounds)
  .route('/providers', providers)
  .route('/traces', traces);

export default app;
