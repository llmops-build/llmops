import { getProviderMetadata } from '@llmops/core';
import { createGateway } from '@llmops/gateway';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
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
  // Mount the in-process gateway plug. Providers come from the llmops() config
  // (set on the context in createApp); base URLs + compat come from core's
  // getProviderMetadata (the bundled default). Built per request for now —
  // cheap, and can be memoized by config later.
  .all('/v1/*', (c) => {
    const gateway = createGateway({
      providers: (c.var.inlineProviders ?? []).map((p) => ({
        provider: p.provider,
        slug: p.slug,
        apiKey: p.apiKey,
        baseURL: p.customHost,
      })),
      getProviderMetadata,
    });
    return gateway(c.req.raw);
  })
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
