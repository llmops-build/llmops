import './types'; // Import types for module augmentation
import { Hono } from 'hono';
import { renderer } from './ssr/renderer';
import api from '@server/handlers/api';
import { env } from 'node:process';

const app = new Hono();

// Note: Static asset serving is handled in createApp (src/index.ts)
// before the database middlewares to avoid heavy initialization for asset requests

app
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
  .use('*', async (c, next) => {
    if (!c.req.path.startsWith('/api')) {
      // Check if running in inline-only mode (no telemetry store)
      const telemetryStore = c.var.telemetryStore;
      if (!telemetryStore) {
        // UI is disabled in inline-only mode
        return c.json(
          {
            error: {
              message:
                'Dashboard UI is not available in inline-only mode. ' +
                'Configure a telemetry store to enable the dashboard.',
              type: 'configuration_error',
            },
          },
          503
        );
      }

      const basePath = c.var.llmopsConfig?.basePath || '';

      return c.html(
        renderer({
          basePath,
          dev: (env.LLMOPS_DEV as unknown) === 'true',
        })
      );
    }
    await next();
  })
  .route('/api', api);

export default app;
