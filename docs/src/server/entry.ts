import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';

const baseHandler = createStartHandler(defaultStreamHandler);

// Wrap the base handler to redirect /llms.txt paths
const fetch = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  // Redirect /llms.txt paths to /api/llms-txt
  if (url.pathname.startsWith('/llms.txt')) {
    const newPath = url.pathname.replace('/llms.txt', '/api/llms-txt');
    const newUrl = new URL(newPath + url.search, url.origin);
    return Response.redirect(newUrl.toString(), 307);
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
