'use client';

import { Check, Copy } from 'lucide-react';
import { useTransition } from 'react';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const cache = new Map<string, string>();

export function CopyMarkdownButton() {
  const [isLoading, startTransition] = useTransition();
  const [checked, onClick] = useCopyButton(async () => {
    startTransition(async () => {
      // Convert /docs/foo/bar to /api/mdx/foo/bar
      const pathname = window.location.pathname;
      const url = pathname.replace(/^\/docs/, '/api/mdx');
      const cached = cache.get(url);

      if (cached) {
        await navigator.clipboard.writeText(cached);
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': fetch(url).then(async (res) => {
              const content = await res.text();
              cache.set(url, content);

              return content;
            }),
          }),
        ]);
      }
    });
  });

  return (
    <button
      type="button"
      disabled={isLoading}
      className={cn(
        buttonVariants({
          variant: 'secondary',
          size: 'sm',
        }),
        'gap-2 [&_svg]:size-3.5'
      )}
      onClick={onClick}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </button>
  );
}
