import { Hono } from 'hono';
import v1 from '@server/handlers/v1';

const app = new Hono();

export const routes = app.route('/v1', v1);

export default app;
