import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { createRequestGuardMiddleware } from './requestGuard';

const app = new Hono();

app
  .use('*', prettyJSON())
  // Health check endpoint
  .get('/health', async (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
  })
  // Request guard (CORS handling)
  .use('*', createRequestGuardMiddleware())
  // The gateway is being rewritten as an in-process "plug" (@llmops/gateway).
  // Until the new plug is wired in, the inference endpoints return 503.
  .all('/v1/*', (c) =>
    c.json(
      {
        error: {
          message:
            'Gateway under reconstruction — the new in-process plug is being implemented.',
          type: 'api_error',
        },
      },
      503,
    ),
  )
  // Error handling
  .notFound((c) =>
    c.json(
      { error: { message: 'Not Found', type: 'invalid_request_error' } },
      404,
    ),
  )
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    return c.json(
      { error: { message: 'Internal Server Error', type: 'api_error' } },
      500,
    );
  });

export default app;
