import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
