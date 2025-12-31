import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import { requestValidator } from './requestValidator';
import { createRequestGuardMiddleware } from './requestGuard';
import { createGatewayAdapterMiddleware } from './gatewayAdapter';
import gateway from '@llmops/gateway';

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
  // Adapter: translates LLMOps config to Portkey gateway format
  .use('*', createGatewayAdapterMiddleware())
  // Mount the gateway at root - gateway routes already have /v1 prefix
  .route('/', gateway)
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
