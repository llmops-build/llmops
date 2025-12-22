'use client';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface Tab {
  name: string;
  code: string;
  language?: string;
}

interface CodeEditorProps {
  tabs: Tab[];
  className?: string;
}

const CodeEditor = ({ tabs, className }: CodeEditorProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  useEffect(() => {
    const highlight = async () => {
      const tab = tabs[activeTab];
      const html = await codeToHtml(tab.code, {
        lang: tab.language || 'typescript',
        themes: {
          light: 'github-light-high-contrast',
          dark: 'github-dark-high-contrast',
        },
        defaultColor: false,
      });
      setHighlightedCode(html);
    };
    highlight();
  }, [activeTab, tabs]);

  return (
    <div
      className={clsx(
        'rounded-lg border border-gray-6 overflow-hidden flex flex-col',
        className
      )}
    >
      <div className="flex border-b border-gray-6">
        {tabs.map((tab, index) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => setActiveTab(index)}
            className={clsx(
              'px-4 py-2 text-sm font-mono transition-colors',
              activeTab === index
                ? 'text-gray-12 border-b-2 border-accent-9'
                : 'text-gray-11 hover:text-gray-12'
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="p-4 overflow-auto flex-1">
        <div
          className="text-sm font-mono [&_pre]:!m-0 [&_pre]:!p-0 [&_span]:![color:var(--shiki-light)] dark:[&_span]:![color:var(--shiki-dark)]"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
