"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language: "typescript" | "bash" | "json";
  filename?: string;
}

const CodeBlock = ({ code, language, filename }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gray4)] bg-[var(--gray1)]">
          <span className="font-mono text-xs text-[var(--gray9)]">
            {filename}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="font-mono text-xs text-[var(--gray9)] hover:text-[var(--gray12)] transition-colors cursor-pointer"
          >
            {copied ? "copied!" : "copy"}
          </button>
        </div>
      )}
      {!filename && (
        <div className="flex justify-end px-4 py-2">
          <button
            type="button"
            onClick={handleCopy}
            className="font-mono text-xs text-[var(--gray9)] hover:text-[var(--gray12)] transition-colors cursor-pointer"
          >
            {copied ? "copied!" : "copy"}
          </button>
        </div>
      )}
      <pre className="p-4 pt-0 overflow-x-auto text-sm leading-relaxed">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
