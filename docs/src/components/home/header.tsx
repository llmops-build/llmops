// @ts-expect-error // svgr import
import Logo from "@/assets/llmops.svg?react";

const Header = () => {
  return (
    <header className="h-14 flex-1 border-b border-b-gray-4 py-1 px-6 flex items-center">
      <div className="flex items-end gap-3">
        <div className="w-8 h-8">
          <Logo className="invert-0 dark:invert" />
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
