import { Hono } from 'hono';
import { renderer } from './ssr/renderer';
import { serveStatic } from 'hono/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

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
  .get('/', async (c) => {
    return c.html(
      renderer({
        // @ts-expect-error Fix types
        basePath: c.var.basePath || '',
      })
    );
  });

export default app;
