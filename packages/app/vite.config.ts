import path from 'path';
import { defineConfig } from 'vite';
import { nodeAdapter } from '@hono/vite-dev-server/node';

import build from '@hono/vite-build';
import devServer from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

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
    babel: {
      plugins: [
        [
          '@stylexjs/babel-plugin',
          {
            dev: process.env.NODE_ENV === 'development',
            runtimeInjection: true,
            treeshakeCompensation: true,
            unstable_moduleResolution: {
              type: 'commonJS',
              rootDir: process.cwd(),
            },
          },
        ],
      ],
    },
  }),
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
          input: ['./src/client/index.tsx', './src/client/styles/stylex.css'],
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
