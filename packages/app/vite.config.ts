import path from 'path';
import fs from 'fs';
import { defineConfig, type UserConfig } from 'vite';
import { nodeAdapter } from '@hono/vite-dev-server/node';

import svgr from 'vite-plugin-svgr';
import build from '@hono/vite-build';
import devServer, { defaultOptions } from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

function copyPublicToAssets() {
  return {
    name: 'copy-public-to-assets',
    apply: 'build' as const,
    writeBundle(options: { dir?: string }) {
      const publicDir = path.resolve(__dirname, 'public');
      const outDir = options.dir || path.resolve(__dirname, 'dist');
      const assetsDir = path.resolve(outDir, 'assets');

      if (!fs.existsSync(publicDir)) return;

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const copyRecursive = (src: string, dest: string) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          for (const file of fs.readdirSync(src)) {
            copyRecursive(path.join(src, file), path.join(dest, file));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      };

      for (const file of fs.readdirSync(publicDir)) {
        copyRecursive(path.join(publicDir, file), path.join(assetsDir, file));
      }
    },
  };
}

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@server': path.resolve(__dirname, './src/server'),
  '@client': path.resolve(__dirname, './src/client'),
  '@shared': path.resolve(__dirname, './src/shared'),
  '@ui': path.resolve(__dirname, './src/client/components/ui'),
};

const commonPlugins = [
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
    routesDirectory: 'src/client/routes',
    generatedRouteTree: 'src/client/routeTree.gen.ts',
  }),
  svgr({
    include: '**/*.svg?react',
  }),
  react({
    jsxImportSource: 'react',
    jsxRuntime: 'automatic',
    babel: {
      plugins: ['babel-plugin-react-compiler'],
    },
  }),
  vanillaExtractPlugin(),
];

export default defineConfig(({ mode }): UserConfig => {
  if (mode === 'production') {
    return {
      base: './',
      publicDir: false,
      resolve: {
        alias,
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
      plugins: [...commonPlugins, copyPublicToAssets()],
    };
  }

  return {
    resolve: {
      alias,
    },
    server: {
      port: 5177,
    },
    plugins: [
      devServer({
        entry: 'src/dev.ts',
        adapter: nodeAdapter,
        exclude: [
          ...defaultOptions.exclude,
          /[?&]tsr-split=(component|[^&]*)(&t=[^&]*)?$/,
          /.*\.svg?.*$/,
        ],
      }),
      build({
        entry: 'src/index.ts',
        staticPaths: ['/assets/*'],
        preset: 'hono',
      }),
      ...commonPlugins,
    ],
  } as UserConfig;
});
