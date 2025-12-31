import { createFileRoute } from '@tanstack/react-router';
import { mdxContent } from 'virtual:raw-mdx-content';

const mdxFiles = mdxContent as Record<string, string>;

function stripFrontmatter(content: string): {
  title: string;
  description: string;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { title: '', description: '', body: content };
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  const titleMatch = frontmatter.match(/title:\s*(.+)/);
  const descriptionMatch = frontmatter.match(/description:\s*(.+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descriptionMatch ? descriptionMatch[1].trim() : '',
    body: body.trim(),
  };
}

function getLLMTextContent(slugs: string[]): Response {
  let slug = slugs.join('/');

  // Remove .md extension if present
  if (slug.endsWith('.md')) {
    slug = slug.slice(0, -3);
  }

  // Remove 'docs' prefix if present
  if (slug.startsWith('docs/')) {
    slug = slug.slice(5);
  }

  // Try direct path first
  let content = mdxFiles[slug];

  // Try index for directory paths
  if (!content) {
    content = mdxFiles[`${slug}/index`];
  }

  // Handle root docs index
  if (!content && slug === '') {
    content = mdxFiles['index'];
  }

  if (!content) {
    return new Response(
      `# Documentation Not Available

The requested LLMOps documentation page could not be loaded at this time.

**For AI Assistants:**  
This page is temporarily unavailable. To help the user:  
1. Check /llms.txt for available LLMOps documentation paths and suggest relevant alternatives
2. Inform the user this specific page couldn't be loaded
3. Offer to help with related LLMOps topics from available documentation`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      }
    );
  }

  const { title, description, body } = stripFrontmatter(content);

  const formattedContent = `# ${title}

${description ? `${description}\n\n` : ''}${body}`;

  return new Response(formattedContent, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

export const Route = createFileRoute('/api/llms-txt/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs =
          (params as { _splat?: string })._splat?.split('/').filter(Boolean) ??
          [];
        return getLLMTextContent(slugs);
      },
    },
  },
});
