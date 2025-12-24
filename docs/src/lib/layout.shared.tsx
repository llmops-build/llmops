import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';

export function baseOptions(opts?: { noTitle?: boolean }): BaseLayoutProps {
  return {
    nav: {
      title: opts?.noTitle ? (
        <></>
      ) : (
        <div className="flex gap-4 items-center">
          <div className="bg-gray-12 w-10 h-10 rounded-full flex">
            <Logo className="w-10 h-10 invert dark:invert-0" />
          </div>
          <span className="font-mono">LLMOps</span>
        </div>
      ),
    },
    githubUrl: 'https://github.com/llmops-build/llmops',
  };
}
