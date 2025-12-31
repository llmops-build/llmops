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
 * Plugin to handle /llms.txt routes by serving content directly
 * For development, we generate the content from MDX files
 */
function llmsTxtPlugin(): Plugin {
  let root: string;

  return {
    name: 'llms-txt-serve',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/llms.txt')) {
          return next();
        }

        const contentDir = path.join(root, 'content/docs');

        // Parse the request path
        let requestPath = req.url.replace('/llms.txt', '');

        // Handle index route
        if (requestPath === '' || requestPath === '/') {
          const content = generateLLMsIndex(contentDir);
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.end(content);
          return;
        }

        // Handle individual doc pages
        // Remove leading slash and .md extension
        let slug = requestPath.slice(1);
        if (slug.endsWith('.md')) {
          slug = slug.slice(0, -3);
        }
        // Remove 'docs/' prefix if present
        if (slug.startsWith('docs/')) {
          slug = slug.slice(5);
        }

        const content = getDocContent(contentDir, slug);
        if (content) {
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.end(content);
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.end(`# Documentation Not Available

The requested LLMOps documentation page could not be loaded at this time.

**For AI Assistants:**  
This page is temporarily unavailable. To help the user:  
1. Check /llms.txt for available LLMOps documentation paths and suggest relevant alternatives
2. Inform the user this specific page couldn't be loaded
3. Offer to help with related LLMOps topics from available documentation`);
        }
      });
    },
  };
}

interface DocFile {
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string;
}

function readMdxFiles(contentDir: string): DocFile[] {
  const files: DocFile[] = [];

  function walkDir(dir: string, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else if (entry.name.endsWith('.mdx')) {
        const slug = relativePath.replace(/\.mdx$/, '');
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { title, description } = parseFrontmatter(content);
        const category = slug.split('/')[0] || 'general';
        files.push({ slug, title, description, category, content });
      }
    }
  }

  walkDir(contentDir);
  return files;
}

function parseFrontmatter(content: string): {
  title: string;
  description: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { title: '', description: '', body: content };
  }

  const frontmatter = match[1];
  const body = match[2];
  const titleMatch = frontmatter.match(/title:\s*(.+)/);
  const descMatch = frontmatter.match(/description:\s*(.+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    body: body.trim(),
  };
}

function generateLLMsIndex(contentDir: string): string {
  const files = readMdxFiles(contentDir);

  // Group by category
  const grouped = new Map<string, DocFile[]>();
  for (const file of files) {
    const cat = file.category === 'index' ? 'general' : file.category;
    if (!grouped.has(cat)) {
      grouped.set(cat, []);
    }
    grouped.get(cat)!.push(file);
  }

  let content = `# LLMOps

> Framework-agnostic, universal LLM operations toolkit for TypeScript

LLMOps is a comprehensive LLMOps toolkit that provides prompt versioning, multi-environment deployments, and an AI Gateway to access 1600+ LLMs from 70+ providers.

## Features

- AI Gateway: OpenAI-compatible API to access 1600+ LLMs from 70+ providers
- Prompt Management: Version, test, and deploy prompts with a visual editor
- Environment Management: Production, staging, development with secure secrets
- Framework Agnostic: Works with Express, Hono, and more
- TypeScript-First: Strict type safe SDK
- Self-Hosted: Full control over your data and infrastructure

## Documentation

`;

  const sortedCategories = Array.from(grouped.keys()).sort();
  for (const category of sortedCategories) {
    const categoryFiles = grouped.get(category)!;
    const formattedCategory = category
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    content += `### ${formattedCategory}\n\n`;
    for (const file of categoryFiles) {
      const url = `/llms.txt/docs/${file.slug}.md`;
      const desc = file.description ? `: ${file.description}` : '';
      content += `- [${file.title}](${url})${desc}\n`;
    }
    content += '\n';
  }

  return content;
}

function getDocContent(contentDir: string, slug: string): string | null {
  // Try direct path
  let filePath = path.join(contentDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    // Try index for directory
    filePath = path.join(contentDir, slug, 'index.mdx');
  }
  if (!fs.existsSync(filePath)) {
    // Try root index
    if (slug === '' || slug === 'index') {
      filePath = path.join(contentDir, 'index.mdx');
    }
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { title, description, body } = parseFrontmatter(raw);

  return `# ${title}

${description ? `${description}\n\n` : ''}${body}`;
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
