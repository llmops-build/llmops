import type { Plugin, Connect } from 'vite';
import type { LLMOpsClient } from '../../client';
import { Readable } from 'node:stream';

function createMiddleware(
  client: LLMOpsClient
): Connect.NextHandleFunction {
  const basePath = client.config.basePath;

  return async (req, res, next) => {
    let urlPath = req.url || '/';

    // Only handle requests that match the basePath
    if (basePath && basePath !== '/' && !urlPath.startsWith(basePath)) {
      return next();
    }

    // Strip the base path if it exists and is not just '/'
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    // Build the full URL with host
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const url = new URL(urlPath, `${protocol}://${host}`);

    // Clone headers from incoming request
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    // Collect request body for non-GET/HEAD requests
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
      body = await new Promise<string>((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await client.handler(request);

    // Check if response is 404, pass to next middleware
    if (response.status === 404) {
      return next();
    }

    // Set response headers
    response.headers?.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.statusCode = response.status;

    // Check if this is a streaming response (SSE)
    const contentType = response.headers?.get('content-type');
    if (contentType?.includes('text/event-stream') && response.body) {
      // For SSE streaming, pipe the body directly to avoid buffering
      Readable.fromWeb(
        response.body as import('stream/web').ReadableStream
      ).pipe(res);
    } else {
      // For non-streaming responses, buffer and send
      const responseBody = await response.text();
      res.end(responseBody);
    }
  };
}

export function llmopsPlugin(client: LLMOpsClient): Plugin {
  const middleware = createMiddleware(client);

  return {
    name: 'vite-plugin-llmops',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
