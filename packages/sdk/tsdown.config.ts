import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    agents: 'src/telemetry/agents-exporter.ts',
    express: 'src/lib/express/index.ts',
    hono: 'src/lib/hono/index.ts',
    nextjs: 'src/lib/nextjs/index.ts',
    'store/pg': 'src/store/pg.ts',
    types: 'src/types/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  // Inline .sql files as strings at build time
  loader: {
    '.sql': 'text',
  },
});
