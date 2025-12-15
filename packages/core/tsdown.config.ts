import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './src/adapters/kysely-adapter/index.ts'],
  exports: true,
  clean: false,
  // ...config options
});
