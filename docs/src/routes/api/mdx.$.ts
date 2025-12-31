import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import fs from 'node:fs/promises';
import path from 'node:path';

async function getMdxContent(slugs: string[]): Promise<Response> {
  const page = source.getPage(slugs);
  if (!page) {
    return new Response('Not found', { status: 404 });
  }

  // Read the raw MDX file
  const filePath = path.join(process.cwd(), 'content/docs', ...slugs) + '.mdx';

  // Also try with index.mdx for directory paths
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch {
    try {
      const indexPath = path.join(
        process.cwd(),
        'content/docs',
        ...slugs,
        'index.mdx'
      );
      content = await fs.readFile(indexPath, 'utf-8');
    } catch {
      return new Response('File not found', { status: 404 });
    }
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

export const Route = createFileRoute('/api/mdx/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs =
          (params as { _splat?: string })._splat?.split('/').filter(Boolean) ??
          [];
        return getMdxContent(slugs);
      },
    },
  },
});
