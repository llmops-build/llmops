import path from 'path';
import { defineConfig } from 'vite';
import { nodeAdapter } from '@hono/vite-dev-server/node';

import build from '@hono/vite-build';
import devServer from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@server': path.resolve(__dirname, './src/server'),
  '@client': path.resolve(__dirname, './src/client'),
  '@shared': path.resolve(__dirname, './src/shared'),
};

const commonPlugins = [
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
    routesDirectory: 'src/client/routes',
    generatedRouteTree: 'src/client/routeTree.gen.ts',
  }),
  react({
    jsxImportSource: 'react',
    jsxRuntime: 'automatic',
  }),
  vanillaExtractPlugin(),
];

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    return {
      resolve: {
        alias,
        noExternal: ['@llmops/ui'],
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        manifest: true,
        rollupOptions: {
          input: ['./src/client/index.tsx', './src/client/styles/styles.css'],
        },
      },
      plugins: commonPlugins,
    };
  }

  return {
    resolve: {
      alias,
      noExternal: ['@llmops/ui'],
    },
    server: {
      port: 5177,
    },
    plugins: [
      devServer({
        entry: 'src/dev.ts',
        adapter: nodeAdapter,
      }),
      build({
        entry: 'src/index.ts',
        staticPaths: ['/assets/*'],
        preset: 'hono',
      }),
      ...commonPlugins,
    ],
  };
});
