'use client';

// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';
import { Link } from '@tanstack/react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const InstallCommand = () => {
  const [copied, setCopied] = useState(false);
  const cmd = 'npm i @llmops/sdk';

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center text-xs font-mono text-gray-9 bg-gray-3 border border-gray-4 px-2.5 py-1 rounded hover:bg-gray-4 transition-colors cursor-pointer"
      >
        {cmd}
      </button>
      {copied && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] font-mono text-gray-1 bg-gray-12 px-2 py-0.5 rounded whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
};

const Header = () => {
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: -8 });

    const trigger = ScrollTrigger.create({
      trigger: '#install',
      start: 'top 80%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      },
      onLeaveBack: () => {
        gsap.to(el, { opacity: 0, y: -8, duration: 0.2 });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <header className="h-14 sticky top-0 z-50 py-1 px-6 flex items-center bg-[var(--background)]/30 backdrop-blur-md">
      <div className="flex items-end gap-3">
        <div className="w-8 h-8 md:hidden">
          <Logo />
        </div>
        <a
          href="https://github.com/llmops-build/llmops"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-9 font-mono text-sm hover:text-gray-12 transition-colors"
        >
          llmops-build/llmops
        </a>
      </div>

      <div ref={actionsRef} className="ml-auto flex items-center gap-3">
        <InstallCommand />
        <Link
          to="/docs"
          className="text-xs font-mono font-medium text-gray-12 bg-gray-3 border border-gray-4 px-3 py-1 rounded hover:bg-gray-4 transition-colors"
        >
          Docs
        </Link>
      </div>
    </header>
  );
};

export default Header;
