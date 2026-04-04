import type { MiddlewareHandler } from 'hono';
import {
  embeddedAssets,
  getAsset,
  decodeAsset,
} from '../generated/embedded-assets';

// Check if we have embedded assets (production single-file mode)
const hasEmbeddedAssets = Object.keys(embeddedAssets).length > 0;

/**
 * Creates a middleware for serving static assets.
 * In production (single-file mode), serves from embedded base64 assets.
 * In development, serves from the filesystem via dynamic import().
 */
export const createStaticAssetMiddleware = (): MiddlewareHandler => {
  if (hasEmbeddedAssets) {
    // Serve from embedded assets (production) — no filesystem needed
    return async (c) => {
      const path = c.req.path;
      const asset = getAsset(path);

      if (!asset) {
        return c.notFound();
      }

      const buffer = decodeAsset(asset);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': asset.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    };
  }

  // Dev mode: lazy-load Node.js modules to avoid crashing edge runtimes
  let devServe: ((c: any) => Promise<Response | undefined>) | null = null;

  return async (c) => {
    if (!devServe) {
      const { fileURLToPath } = await import('node:url');
      const { dirname, join } = await import('node:path');
      const { readFile } = await import('node:fs/promises');
      const currentDir = dirname(fileURLToPath(import.meta.url));

      devServe = async (ctx) => {
        const path = ctx.req.path;
        try {
          const file = await readFile(join(currentDir, '..', path));
          const ext = path.split('.').pop() || '';
          const mimeTypes: Record<string, string> = {
            js: 'application/javascript',
            mjs: 'application/javascript',
            css: 'text/css',
            svg: 'image/svg+xml',
            png: 'image/png',
            jpg: 'image/jpeg',
            ico: 'image/x-icon',
            woff: 'font/woff',
            woff2: 'font/woff2',
          };
          return new Response(file, {
            headers: {
              'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            },
          });
        } catch {
          return undefined;
        }
      };
    }

    const response = await devServe(c);
    if (response) return response;
    return c.notFound();
  };
};
