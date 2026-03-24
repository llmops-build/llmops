import { Hono, type Context } from 'hono';
import v1 from '@server/handlers/v1';
import genaiV1 from '@server/handlers/genai';
import otlp from '@server/handlers/otlp';
import langsmith from '@server/handlers/langsmith';

const app = new Hono();

/**
 * Error response for routes that require a telemetry store in inline-only mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storeRequiredError = (c: Context<any, any, any>) => {
  return c.json(
    {
      error: {
        message:
          'This endpoint requires a telemetry store. ' +
          'Configure telemetry (e.g. pgStore) to use dashboard API features.',
        type: 'configuration_error',
      },
    },
    503
  );
};

export const routes = app
  // Block v1 API routes if no telemetry store (inline-only mode)
  .use('/v1/*', async (c, next) => {
    const store = c.get('telemetryStore');
    if (!store) {
      return storeRequiredError(c);
    }
    await next();
  })
  .route('/genai', genaiV1)
  .route('/otlp', otlp)
  .route('/langsmith', langsmith)
  .route('/v1', v1);

export default app;
