import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    agents: 'src/telemetry/agents-exporter.ts',
    express: 'src/lib/express/index.ts',
    hono: 'src/lib/hono/index.ts',
    nextjs: 'src/lib/nextjs/index.ts',
    'store/pg': 'src/store/pg.ts',
    'store/d1': 'src/store/d1.ts',
    'store/sqlite': 'src/store/sqlite.ts',
    eval: 'src/eval/index.ts',
    types: 'src/types/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  plugins: [
    // Inline .sql files as string exports at build time
    {
      name: 'sql-loader',
      load(id) {
        if (id.endsWith('.sql')) {
          const content = readFileSync(id, 'utf-8');
          return `export default ${JSON.stringify(content)};`;
        }
      },
    },
  ],
});
