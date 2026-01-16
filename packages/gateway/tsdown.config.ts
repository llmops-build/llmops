import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  banner: {
    js: '"use node";',
  },
  // Keep all dependencies external for edge runtime compatibility
  unbundle: true,
  external: [
    // Node.js built-ins
    'node:stream',
    'events',
    'node:fs/promises',
    'node:crypto',
    'node:util',
    // Third-party that should stay external
    'hono',
  ],
});
