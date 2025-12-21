import { Hono } from 'hono';
import v1 from '@server/handlers/v1';
import genaiV1 from '@server/handlers/genai';

const app = new Hono();

export const routes = app.route('/genai', genaiV1).route('/v1', v1);

export default app;
