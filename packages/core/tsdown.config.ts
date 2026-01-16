import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    './src/index.ts', // Edge-compatible main entry
    './src/db/index.ts', // Database utilities
    './src/node.ts', // Node.js-only features (FileCacheBackend, etc.)
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
