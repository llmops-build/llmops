import { Hono } from 'hono';
import analytics from '@server/handlers/analytics';
import datasets from '@server/handlers/datasets';
import playgrounds from '@server/handlers/playgrounds';
import traces from '@server/handlers/traces';
const app = new Hono()
  .route('/analytics', analytics)
  .route('/datasets', datasets)
  .route('/playgrounds', playgrounds)
  .route('/traces', traces);

export default app;
