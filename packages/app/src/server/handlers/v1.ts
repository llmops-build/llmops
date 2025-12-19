import { Hono } from 'hono';
import configs from '@server/handlers/configs';
import environments from '@server/handlers/environments';
import genaiV1 from '@server/handlers/genai';
import providers from '@server/handlers/providers';
import targeting from '@server/handlers/targeting';
import variants from '@server/handlers/variants';

const app = new Hono()
  .route('/configs', configs)
  .route('/environments', environments)
  .route('/genai', genaiV1)
  .route('/providers', providers)
  .route('/targeting', targeting)
  .route('/variants', variants);

export default app;
