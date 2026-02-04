import type { NextRequest } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { LLMOpsClient } from '../../client';
import { Readable } from 'node:stream';

type NextJsHandler = (request: NextRequest) => Promise<Response>;

type NextJsHandlers = {
  GET: NextJsHandler;
  POST: NextJsHandler;
  PUT: NextJsHandler;
  DELETE: NextJsHandler;
  PATCH: NextJsHandler;
};

/**
 * Converts an LLMOps client to Next.js App Router handlers.
 * Use this with the App Router (app directory).
 *
 * IMPORTANT: To avoid build-time execution issues, use lazy initialization:
 *
 * @example
 * ```ts
 * // lib/llmops.ts - Create a getter function for lazy initialization
 * import { llmops, type LLMOpsClient } from '@llmops/sdk';
 * import { Pool } from 'pg';
 *
 * let cachedClient: LLMOpsClient | null = null;
 *
 * export function getLLMOpsClient(): LLMOpsClient {
 *   if (!cachedClient) {
 *     cachedClient = llmops({
 *       basePath: '/api/llmops',
 *       database: new Pool({ connectionString: process.env.POSTGRES_URL || '' }),
 *     });
 *   }
 *   return cachedClient;
 * }
 * ```
 *
 * @example
 * ```ts
 * // app/api/llmops/[[...path]]/route.ts
 * import type { NextRequest } from 'next/server';
 * import { toNextJsHandler } from '@llmops/sdk/nextjs';
 * import { getLLMOpsClient } from '@/lib/llmops';
 *
 * export async function GET(request: NextRequest) {
 *   return toNextJsHandler(getLLMOpsClient()).GET(request);
 * }
 *
 * export async function POST(request: NextRequest) {
 *   return toNextJsHandler(getLLMOpsClient()).POST(request);
 * }
 *
 * // ... similar for PUT, DELETE, PATCH
 * ```
 */
export function toNextJsHandler(client: LLMOpsClient): NextJsHandlers {
  const basePath = client.config.basePath;

  const handler = async (request: NextRequest): Promise<Response> => {
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

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
  };
}

type NodeHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Converts an LLMOps client to a Node.js/Pages Router handler.
 * Use this with the Pages Router (pages/api directory).
 *
 * @example
 * ```ts
 * // pages/api/llmops/[[...path]].ts
 * import { toNodeHandler } from '@llmops/sdk/nextjs';
 * import { llmops } from '@/lib/llmops';
 *
 * export default toNodeHandler(llmops);
 *
 * export const config = {
 *   api: { bodyParser: false },
 * };
 * ```
 */
export function toNodeHandler(client: LLMOpsClient): NodeHandler {
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
