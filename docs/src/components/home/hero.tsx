import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
// @ts-expect-error // svgr import
import GitHubLogo from '@/assets/github.svg?react';
import styles from './home.module.css';
import LogoAnimation from './logo-animation';

const formatStars = (count: number): string => {
  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(1);
    return formatted.endsWith('.0')
      ? `${Math.floor(count / 1000)}k`
      : `${formatted}k`;
  }
  return count.toString();
};

const useGitHubStars = () => {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/llmops-build/llmops')
      .then((res) => res.json())
      .then((data) => {
        setStars(data.stargazers_count);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { stars, loading };
};

const StarsSkeleton = () => (
  <span className="inline-block w-[3ch] h-4 bg-gray-6 rounded animate-pulse" />
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const AI_PROMPT = `Read https://llmops.build/llms.txt/runbook.md and integrate LLMOps in this application.
Use a separate branch for the changes.`;

const Hero = () => {
  const [copied, setCopied] = useState(false);
  const { stars, loading } = useGitHubStars();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={clsx(
        'max-w-4xl mx-auto flex w-full items-center justify-stretch h-full px-4 lg:px-8',
        styles.hero
      )}
    >
      <div className="grid grid-cols-1 w-full h-full place-items-center gap-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-md justify-center">
          <LogoAnimation />
          <h1 className="text-2xl text-center text-gray-11 text-pretty font-normal">
            A pluggable <span className="text-gray-12">LLMOps</span> toolkit for
            TypeScript applications
          </h1>
          <div className="w-full border border-solid border-gray-4 rounded-md">
            <div className="w-full px-3 py-2 flex gap-3 items-start border-b border-solid border-gray-4">
              <pre className="text-gray-11 text-sm flex-1 font-mono whitespace-pre-wrap break-all leading-5">
                {AI_PROMPT}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="text-gray-8 hover:text-gray-12 transition-colors cursor-pointer bg-transparent border-none p-1 shrink-0"
                aria-label="Copy prompt to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
            <a
              href="https://github.com/llmops-build/llmops"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 flex gap-2 items-center text-gray-8 hover:text-gray-12 hover:bg-gray-2 transition-colors rounded-b-md"
            >
              <GitHubLogo className="w-4 h-4 fill-current" />
              <span className="text-sm">llmops-build/llmops</span>
              <span className="text-sm font-mono ml-auto">
                {loading ? <StarsSkeleton /> : stars && formatStars(stars)}
              </span>
            </a>
          </div>
          <div className="dark flex gap-3">
            <Link
              to="/docs/$"
              params={{
                // @ts-expect-error Expected
                '*': 'getting-started/installation',
              }}
              className="bg-accent-9 text-accent-12 dark:text-accent-12 hover:bg-accent-10 h-8 px-3 text-sm font-medium rounded flex items-center justify-center gap-1 transition-colors"
            >
              Get Started &rarr;
            </Link>
            <a
              href="https://railway.com/deploy/a_45hq?referralCode=RgsWj1&utm_medium=integration&utm_source=template&utm_campaign=generic"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://railway.com/button.svg"
                alt="Deploy on Railway"
                className="h-8"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
