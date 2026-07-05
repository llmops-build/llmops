import { getModelPricing, getProviderMetadata } from '@llmops/core';
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
  // bundled getProviderMetadata; pricing comes from core's getModelPricing
  // (live fetch from models.llmops.build, cached). Telemetry sink is built once
  // in createApp and set on the context; the gateway streams usage/cost events
  // to it (fire-and-forget via the stream-tee instrument). Built per request for
  // now — cheap, and can be memoized by config later.
  .all('/v1/*', async (c) => {
    const gateway = createGateway({
      providers: (c.var.inlineProviders ?? []).map((p) => ({
        provider: p.provider,
        slug: p.slug,
        apiKey: p.apiKey,
        baseURL: p.customHost,
      })),
      getProviderMetadata,
      getModelPricing,
      telemetry: c.get('telemetrySink'),
      waitUntil: c.get('llmopsConfig').waitUntil,
    });
    const upstream = await gateway(c.req.raw);
    // The gateway returns a frozen Response; Hono's downstream middleware
    // (cors etc.) mutates c.res.headers, so re-wrap into a mutable body that
    // preserves status + (copied) headers + the streaming body.
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: new Headers(upstream.headers),
      // @ts-expect-error - duplex is a stable RequestInit option in Node 18+.
      duplex: 'half',
    });
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
