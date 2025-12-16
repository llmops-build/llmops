import { Hono } from 'hono';
import genaiV1 from '@server/handlers/genai';
import configs from '@server/handlers/configs';

const app = new Hono().route('/genai', genaiV1).route('/configs', configs);

export default app;
