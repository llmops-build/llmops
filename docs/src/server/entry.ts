import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';

const baseHandler = createStartHandler(defaultStreamHandler);

// Wrap the base handler to handle /llms.txt paths by internally rewriting to /api/llms-txt
const fetch = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  // Rewrite /llms.txt paths to /api/llms-txt internally
  if (url.pathname.startsWith('/llms.txt')) {
    const newPath = url.pathname.replace('/llms.txt', '/api/llms-txt');
    const newUrl = new URL(newPath + url.search, url.origin);
    // Create a new request with the rewritten URL
    const newRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    return baseHandler(newRequest);
  }

  return baseHandler(request);
};

function createServerEntry(entry: { fetch: typeof fetch }) {
  return {
    async fetch(...args: Parameters<typeof fetch>) {
      return await entry.fetch(...args);
    },
  };
}

const server = createServerEntry({ fetch });

export { createServerEntry, server as default };
