import path from 'path';
import { defineConfig } from 'vite';
import { nodeAdapter } from '@hono/vite-dev-server/node';

import build from '@hono/vite-build';
import devServer from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@server': path.resolve(__dirname, './src/server'),
  '@client': path.resolve(__dirname, './src/client'),
  '@shared': path.resolve(__dirname, './src/shared'),
};

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
          input: ['./src/client/index.tsx', './src/client/styles/global.css'],
        },
      },
      plugins: [
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
      ],
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
        entry: 'src/index.ts',
        adapter: nodeAdapter,
      }),
      build({
        entry: 'src/index.ts',
        staticPaths: ['/assets/*'],
        preset: 'hono',
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
    ],
  };
});
