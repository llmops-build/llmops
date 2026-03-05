import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './src/index.edge.ts', './src/db/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
