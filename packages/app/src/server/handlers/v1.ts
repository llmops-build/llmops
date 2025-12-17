import { Hono } from 'hono';
import genaiV1 from '@server/handlers/genai';
import configs from '@server/handlers/configs';
import providers from '@server/handlers/providers';

const app = new Hono()
  .route('/genai', genaiV1)
  .route('/configs', configs)
  .route('/providers', providers);

export default app;
