import FoldInstall from '@/components/home/fold-1-install';
import FoldProviders from '@/components/home/fold-2-providers';
import FoldObserve from '@/components/home/fold-3-observe';
import FoldUI from '@/components/home/fold-4-ui';
import FoldPrompts from '@/components/home/fold-5-prompts';
import FoldEvals from '@/components/home/fold-6-evals';
import Header from '@/components/home/header';
import Hero from '@/components/home/hero';
import LogoAnimation from '@/components/home/logo-animation';
import './-styles/base.css';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[var(--sidebar-width)_1fr] min-h-screen bg-background force-light">
      {/* Sidebar — single row, full height */}
      <aside className="hidden md:block relative">
        <div className="border-r border-[var(--gray4)] sticky top-0 h-screen w-full flex flex-col">
          <LogoAnimation />
          <div className="mt-auto p-4">
            <button
              type="button"
              className="w-full text-xs font-mono text-[var(--gray9)] hover:text-[var(--gray12)] transition-colors cursor-pointer"
              onClick={() => {
                document.documentElement.classList.toggle('dark');
              }}
            >
              toggle theme
            </button>
          </div>
        </div>
      </aside>

      {/* Main — header + body */}
      <div className="grid grid-rows-[auto_1fr]">
        <Header />
        <main>
          <Hero />
          <FoldInstall />
          {/*<FoldProviders />
          <FoldObserve />
          <FoldUI />
          <FoldPrompts />
          <FoldEvals />*/}
        </main>
      </div>
    </div>
  );
}
