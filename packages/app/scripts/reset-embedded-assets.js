#!/usr/bin/env node

/**
 * Resets the embedded-assets.ts file to an empty state for dev mode.
 * This prevents the dev server from using stale production asset hashes.
 * Also clears Vite cache to ensure fresh transforms.
 */

import { writeFileSync, rmSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const embeddedAssetsPath = join(
  __dirname,
  '../src/server/generated/embedded-assets.ts'
);
const viteCachePath = join(__dirname, '../node_modules/.vite');

const emptyEmbeddedAssets = `
// Auto-generated embedded assets module
// This file is generated during build and should not be edited manually
// Reset for dev mode - will be populated during production build

export interface EmbeddedAsset {
  content: string; // base64 encoded
  mimeType: string;
}

export const embeddedAssets: Record<string, EmbeddedAsset> = {};

export const manifest = {};

export const getAsset = (path: string): EmbeddedAsset | undefined => {
  return embeddedAssets[path];
};

export const decodeAsset = (asset: EmbeddedAsset): Buffer => {
  return Buffer.from(asset.content, 'base64');
};
`;

writeFileSync(embeddedAssetsPath, emptyEmbeddedAssets);
console.log('Reset embedded-assets.ts for dev mode');

// Clear Vite cache
if (existsSync(viteCachePath)) {
  rmSync(viteCachePath, { recursive: true, force: true });
  console.log('Cleared Vite cache');
}
