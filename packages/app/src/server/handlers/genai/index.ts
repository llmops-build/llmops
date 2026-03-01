import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { requestValidator } from './requestValidator';
import { createRequestGuardMiddleware } from './requestGuard';
import { createGatewayAdapterMiddleware } from './gatewayAdapter';
import { createCostTrackingMiddleware } from '@server/middlewares/costTracking';
import { proxyRequest } from '@llmops/gateway';

const app = new Hono();

// Middleware
app
  .use('*', prettyJSON())
  // Health check endpoint
  .get('/health', async (c) => {
    return c.json({ status: 'healthy' });
  })
  // LLMOps request validation (x-llmops-config, Authorization)
  .use('*', requestValidator)
  // Request guard (extracts envSec from apiKey, CORS handling)
  .use('*', createRequestGuardMiddleware())
  // Cost tracking middleware (captures usage and costs from responses)
  .use('*', createCostTrackingMiddleware())
  // Adapter: resolves provider config and merges variant body
  .use('*', createGatewayAdapterMiddleware())
  // Proxy to upstream provider
  .all('/v1/*', async (c) => {
    const providerConfig = c.get('providerConfig');
    if (!providerConfig) {
      return c.json(
        { error: { message: 'Provider config not resolved', type: 'server_error' } },
        500
      );
    }
    return proxyRequest(providerConfig, c.req.raw);
  })
  // Error handling
  .notFound((c) =>
    c.json(
      { error: { message: 'Not Found', type: 'invalid_request_error' } },
      404
    )
  )
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    return c.json(
      { error: { message: 'Internal Server Error', type: 'api_error' } },
      500
    );
  });

export default app;
