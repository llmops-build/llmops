import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  banner: {
    js: '"use node";',
  },
});
