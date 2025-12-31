import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';

interface PageInfo {
  title: string;
  description: string;
  url: string;
  category: string;
}

function groupPagesByCategory(
  pages: ReturnType<typeof source.getPages>
): Map<string, PageInfo[]> {
  const grouped = new Map<string, PageInfo[]>();

  for (const page of pages) {
    const category = page.slugs[0] || 'general';
    const pageInfo: PageInfo = {
      title: page.data.title,
      description: page.data.description || '',
      url: `/llms.txt${page.url}.md`,
      category: category,
    };

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(pageInfo);
  }

  return grouped;
}

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateLLMsText(): string {
  const pages = source.getPages();
  const groupedPages = groupPagesByCategory(pages);

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

  const sortedCategories = Array.from(groupedPages.keys()).sort();

  for (const category of sortedCategories) {
    const categoryPages = groupedPages.get(category)!;
    const formattedCategory = formatCategoryName(category);

    content += `### ${formattedCategory}\n\n`;

    for (const page of categoryPages) {
      const description = page.description ? `: ${page.description}` : '';
      content += `- [${page.title}](${page.url})${description}\n`;
    }

    content += '\n';
  }

  return content;
}

export const Route = createFileRoute('/api/llms-txt')({
  server: {
    handlers: {
      GET: async () => {
        const content = generateLLMsText();
        return new Response(content, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
          },
        });
      },
    },
  },
});
