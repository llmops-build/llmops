import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './src/db/index.ts'],
  exports: true,
  clean: false,
  // ...config options
});
