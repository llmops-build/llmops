import type { LLMOpsClient } from '../../client';

export function toNextJsHandler(client: LLMOpsClient) {
  const basePath = client.config.basePath;

  const handler = async (request: Request) => {
    if (!('handler' in client)) {
      return new Response('Not Found', { status: 404 });
    }

    const url = new URL(request.url);
    let urlPath = url.pathname;

    // Strip the base path if it exists and is not just '/'
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    // Construct new URL with stripped path, preserving query string
    const newUrl = new URL(urlPath + url.search, url.origin);

    // Create new request with modified URL
    const newRequest = new Request(newUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      // @ts-expect-error - duplex is needed for streaming request bodies
      duplex: 'half',
    });

    return client.handler(newRequest);
  };

  return {
    GET: handler,
    POST: handler,
    PATCH: handler,
    PUT: handler,
    DELETE: handler,
  };
}
