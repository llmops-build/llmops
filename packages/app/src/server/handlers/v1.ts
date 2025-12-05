import { Hono } from 'hono';
import genaiV1 from '@server/handlers/genai';

const app = new Hono().route('/genai', genaiV1);

export default app;
