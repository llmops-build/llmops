import { Hono } from 'hono';
import analytics from '@server/handlers/analytics';
import traces from '@server/handlers/traces';

const app = new Hono()
  .route('/analytics', analytics)
  .route('/traces', traces);

export default app;
