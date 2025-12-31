import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import mdx from 'fumadocs-mdx/vite';
import { defineConfig, type Plugin, type Connect } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsConfigPaths from 'vite-tsconfig-paths';
import fs from 'node:fs';
import path from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Plugin to handle /llms.txt routes by redirecting to /api/llms-txt
 */
function llmsTxtPlugin(): Plugin {
  return {
    name: 'llms-txt-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/llms.txt')) {
          // Redirect /llms.txt to /api/llms-txt
          const newUrl = req.url.replace('/llms.txt', '/api/llms-txt');
          res.writeHead(307, { Location: newUrl });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

/**
 * Plugin to serve raw MDX content for the copy markdown feature.
 * Creates a virtual module with all MDX content bundled.
 */
function rawMdxPlugin(): Plugin {
  const virtualModuleId = 'virtual:raw-mdx-content';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  let root: string;

  return {
    name: 'raw-mdx',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const contentDir = path.join(root, 'content/docs');
        const mdxFiles: Record<string, string> = {};

        function walkDir(dir: string, prefix = '') {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = prefix
              ? `${prefix}/${entry.name}`
              : entry.name;
            if (entry.isDirectory()) {
              walkDir(fullPath, relativePath);
            } else if (entry.name.endsWith('.mdx')) {
              const slug = relativePath.replace(/\.mdx$/, '');
              mdxFiles[slug] = fs.readFileSync(fullPath, 'utf-8');
            }
          }
        }

        walkDir(contentDir);

        return `export const mdxContent = ${JSON.stringify(mdxFiles)};`;
      }
      return null;
    },
  };
}

export default defineConfig({
  server: {
    port: 3002,
  },
  plugins: [
    llmsTxtPlugin(),
    rawMdxPlugin(),
    isProduction && cloudflare({ viteEnvironment: { name: 'ssr' } }),
    mdx(await import('./source.config')),
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      server: {
        entry: './src/server/entry.ts',
      },
    }),
    react(),
    svgr(),
  ].filter(Boolean),
});
