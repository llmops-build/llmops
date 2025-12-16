import { Hono } from 'hono';
import genaiV1 from '@server/handlers/genai';
import configs from '@server/handlers/configs';
import variants from '@server/handlers/variants';

const app = new Hono()
  .route('/genai', genaiV1)
  .route('/configs', configs)
  .route('/variants', variants);

export default app;
