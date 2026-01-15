import type { GenericActionCtx } from 'convex/server';
import type { LLMOpsClient } from '../../client';

export function createLLMOpsHandler(client: LLMOpsClient) {
  const basePath = client.config.basePath;

  return async (
    _ctx: GenericActionCtx<any>,
    request: Request
  ): Promise<Response> => {
    let urlPath = new URL(request.url).pathname;

    // Strip the base path if it exists
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    const url = new URL(urlPath, request.url);

    const newRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    return client.handler(newRequest);
  };
}
