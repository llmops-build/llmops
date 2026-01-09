import type { MiddlewareHandler } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import {
  embeddedAssets,
  getAsset,
  decodeAsset,
} from '../generated/embedded-assets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we have embedded assets (production single-file mode)
const hasEmbeddedAssets = Object.keys(embeddedAssets).length > 0;

/**
 * Creates a middleware for serving static assets.
 * In production (single-file mode), serves from embedded base64 assets.
 * In development, serves from the filesystem.
 */
export const createStaticAssetMiddleware = (): MiddlewareHandler => {
  if (hasEmbeddedAssets) {
    // Serve from embedded assets (production)
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

  // Serve from filesystem (development mode)
  return serveStatic({
    root: './',
    getContent: async (path) => {
      try {
        // In development, assets are in dist/assets relative to server
        const file = await readFile(join(__dirname, '..', path));
        return file;
      } catch {
        return null;
      }
    },
  });
};
