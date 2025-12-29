import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    express: 'src/lib/express/index.ts',
    hono: 'src/lib/hono/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  // Force bundling of workspace dependencies
  // noExternal: ['@llmops/app', '@llmops/core', '@llmops/ui'],
  // // Keep these external
  // external: ['express', 'hono'],
});
