import './types'; // Import types for module augmentation
import { Hono } from 'hono';
import { renderer } from './ssr/renderer';
import { serveStatic } from 'hono/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import api from '@server/handlers/api';
import { env } from 'node:process';

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
  .use('*', async (c) => {
    if (!c.req.path.startsWith('/api')) {
      const basePath = c.var.llmopsConfig.basePath || '';
      return c.html(
        renderer({
          basePath,
          dev: (env.LLMOPS_DEV as unknown) === 'true',
        })
      );
    }
  })
  .route('/api', api);

export default app;
