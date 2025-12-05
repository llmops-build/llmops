import type {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from 'express';
import type { LLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';

export function createLLMOpsMiddleware(options: LLMOpsConfig) {
  const { basePath } = options;
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

    const { app } = createApp(options);
    const response = await app.fetch(request);

    // Check if response is 404, pass to next middleware
    if (response.status === 404) {
      return next();
    }

    response.headers?.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    const body = await response.text();
    res.send(body);
  };
}
