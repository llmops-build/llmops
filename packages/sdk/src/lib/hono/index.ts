import type { Context, MiddlewareHandler, Next } from 'hono';
import type { LLMOpsClient } from '../../client';

export function createLLMOpsMiddleware(
  client: LLMOpsClient
): MiddlewareHandler {
  const basePath = client.config.basePath;

  return async (c: Context, next: Next) => {
    let urlPath = c.req.path;

    // Strip the base path if it exists
    if (basePath && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    const url = new URL(urlPath, c.req.url);

    // Clone headers from incoming request
    const headers = new Headers();
    c.req.raw.headers.forEach((value: string, key: string) => {
      headers.set(key, value);
    });

    const request = new Request(url, {
      method: c.req.method,
      headers,
      body: ['GET', 'HEAD'].includes(c.req.method)
        ? undefined
        : await c.req.text(),
    });

    const response = await client.handler(request);

    // Check if response is 404, pass to next middleware
    if (response.status === 404) {
      return next();
    }

    // Copy response headers
    response.headers?.forEach((value: string, key: string) => {
      c.header(key, value);
    });

    c.status(response.status as any);

    // Check if this is a streaming response (SSE)
    const contentType = response.headers?.get('content-type');
    if (contentType?.includes('text/event-stream') && response.body) {
      // For SSE streaming, return the stream directly
      return c.body(response.body);
    }

    // For non-streaming responses, return the text
    const body = await response.text();
    return c.body(body);
  };
}
