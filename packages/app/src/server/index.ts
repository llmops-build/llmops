import { Hono } from 'hono';
import { renderer } from './ssr/renderer';
import { serveStatic } from 'hono/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import api from '@server/handlers/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = new Hono();

app
  .use(
    '/assets/*',
    serveStatic({
      root: './',
      getContent: async (path) => {
        const file = await readFile(join(__dirname, path));
        return file;
      },
    })
  )
  .get('/health', (c) => c.json({ status: 'ok' }))
  .get('/', async (c) => {
    return c.html(
      renderer({
        // @ts-expect-error Fix types
        basePath: c.var.basePath || '',
      })
    );
  })
  .route('/api', api);

export default app;
