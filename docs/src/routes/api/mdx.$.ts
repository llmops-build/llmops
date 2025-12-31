import { createFileRoute } from '@tanstack/react-router';
import { mdxContent } from 'virtual:raw-mdx-content';

const mdxFiles = mdxContent as Record<string, string>;

function getMdxContent(slugs: string[]): Response {
  const slug = slugs.join('/');

  // Try direct path first (e.g., quickstart)
  let content = mdxFiles[slug];

  // Try index for directory paths (e.g., handbook -> handbook/index)
  if (!content) {
    content = mdxFiles[`${slug}/index`];
  }

  // Handle root docs index
  if (!content && slug === '') {
    content = mdxFiles['index'];
  }

  if (!content) {
    return new Response('Not found', { status: 404 });
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
