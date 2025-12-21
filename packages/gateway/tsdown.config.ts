import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  exports: true,
  clean: false,
});
