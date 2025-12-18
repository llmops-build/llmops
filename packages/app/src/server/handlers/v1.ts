import { Hono } from 'hono';
import genaiV1 from '@server/handlers/genai';
import configs from '@server/handlers/configs';
import providers from '@server/handlers/providers';
import variants from '@server/handlers/variants';

const app = new Hono()
  .route('/genai', genaiV1)
  .route('/configs', configs)
  .route('/providers', providers)
  .route('/variants', variants);

export default app;
