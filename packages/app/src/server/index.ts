import './types'; // Import types for module augmentation
import { Hono } from 'hono';
import { renderer } from './ssr/renderer';
import { serveStatic } from 'hono/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import api from '@server/handlers/api';
import { env } from 'node:process';
import type { SupportedProviders } from '@llmops/core';

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
  .use('*', async (c, next) => {
    if (!c.req.path.startsWith('/api')) {
      const basePath = c.var.llmopsConfig.basePath || '';
      const providers = c.var.providers;

      return c.html(
        renderer({
          basePath,
          dev: (env.LLMOPS_DEV as unknown) === 'true',
          llmProviders: Object.keys(providers)
            .filter((key) => providers[key as SupportedProviders] !== undefined)
            .map((key) => {
              const provider = providers[key as SupportedProviders]!;
              return {
                key,
                name: provider.getName(),
                imageURI: provider.getImageURI(),
              };
            }),
        })
      );
    }
    await next();
  })
  .route('/api', api);

export default app;
