import type {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from 'express';
import type { LLMOpsClient } from '../../client';
import { Readable } from 'node:stream';

export function createLLMOpsMiddleware(client: LLMOpsClient) {
  const basePath = client.config.basePath;
  return async (req: ExpressRequest, res: Response, next: NextFunction) => {
    let urlPath = req.originalUrl;

    // Strip the base path if it exists
    if (basePath && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    const url = new URL(urlPath, `${req.protocol}://${req.get('host')}`);

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    const response = await client.handler(request);

    // Check if response is 404, pass to next middleware
    if (response.status === 404) {
      return next();
    }

    response.headers?.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // Check if this is a streaming response (SSE)
    const contentType = response.headers?.get('content-type');
    if (contentType?.includes('text/event-stream') && response.body) {
      // For SSE streaming, pipe the body directly to avoid buffering
      // Convert Web ReadableStream to Node.js Readable and pipe to response
      Readable.fromWeb(
        response.body as import('stream/web').ReadableStream
      ).pipe(res);
    } else {
      // For non-streaming responses, buffer and send
      const body = await response.text();
      res.send(body);
    }
  };
}
