// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';

const Header = () => {
  return (
    <header className="h-14 sticky top-0 z-10 border-b border-b-gray-4 py-1 px-6 flex items-center bg-[var(--background)]/30 backdrop-blur-md">
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
    </header>
  );
};

export default Header;
