import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  banner: {
    js: '"use node";',
  },
});
