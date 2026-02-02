import type { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { LLMOpsClient } from '../../client';
import { Readable } from 'node:stream';

/**
 * Creates a Next.js App Router route handler for LLMOps.
 * Use this with the App Router (app directory).
 *
 * @example
 * ```ts
 * // app/api/llmops/[[...path]]/route.ts
 * import { createLLMOpsHandler } from '@llmops/sdk/nextjs';
 * import { llmops } from './llmops';
 *
 * const handler = createLLMOpsHandler(llmops);
 *
 * export const GET = handler;
 * export const POST = handler;
 * export const PUT = handler;
 * export const DELETE = handler;
 * export const PATCH = handler;
 * ```
 */
export function createLLMOpsHandler(client: LLMOpsClient) {
  const basePath = client.config.basePath;

  return async (request: NextRequest): Promise<Response> => {
    const url = new URL(request.url);
    let urlPath = url.pathname;

    // Strip the base path if it exists
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    // Reconstruct URL with stripped path but preserve query string
    const newUrl = new URL(urlPath + url.search, url.origin);

    const newRequest = new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method)
        ? undefined
        : await request.text(),
    });

    return client.handler(newRequest);
  };
}

/**
 * Creates a Next.js Pages Router API handler for LLMOps.
 * Use this with the Pages Router (pages/api directory).
 *
 * @example
 * ```ts
 * // pages/api/llmops/[[...path]].ts
 * import { createLLMOpsApiHandler } from '@llmops/sdk/nextjs';
 * import { llmops } from '../../../llmops';
 *
 * export default createLLMOpsApiHandler(llmops);
 *
 * export const config = {
 *   api: {
 *     bodyParser: false,
 *   },
 * };
 * ```
 */
export function createLLMOpsApiHandler(client: LLMOpsClient) {
  const basePath = client.config.basePath;

  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    let urlPath = req.url || '/';

    // Strip the base path if it exists
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    // Get protocol and host
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const url = new URL(urlPath, `${protocol}://${host}`);

    // Convert headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    // Read body for non-GET/HEAD requests
    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
      body = await readBody(req);
    }

    const request = new Request(url, {
      method: req.method || 'GET',
      headers,
      body,
    });

    const response = await client.handler(request);

    // Copy response headers
    response.headers?.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // Check if this is a streaming response (SSE)
    const contentType = response.headers?.get('content-type');
    if (contentType?.includes('text/event-stream') && response.body) {
      // For SSE streaming, pipe the body directly
      Readable.fromWeb(
        response.body as import('stream/web').ReadableStream
      ).pipe(res);
    } else {
      // For non-streaming responses, send the text
      const responseBody = await response.text();
      res.send(responseBody);
    }
  };
}

/**
 * Helper to read the request body as a string
 */
function readBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}
