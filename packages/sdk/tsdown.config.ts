import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    express: 'src/lib/express/index.ts',
    hono: 'src/lib/hono/index.ts',
    convex: 'src/lib/convex/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  banner: {
    js: '"use node";',
  },
  // Keep all dependencies external for edge runtime compatibility
  unbundle: true,
  // Explicitly external common problematic imports
  external: [
    // Node.js built-ins
    'node:stream',
    'events',
    'node:fs/promises',
    'node:crypto',
    'node:util',
    // Workspace dependencies
    '@llmops/core',
    '@llmops/gateway',
    // Third-party that should stay external
    'express',
    'hono',
  ],
});
