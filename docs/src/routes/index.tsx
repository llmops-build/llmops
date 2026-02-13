import FoldInstall from '@/components/home/fold-1-install';
import FoldProviders from '@/components/home/fold-2-providers';
import FoldObserve from '@/components/home/fold-3-observe';
import FoldCosts from '@/components/home/fold-4-costs';
import FoldPrompts from '@/components/home/fold-5-prompts';
import FoldEvals from '@/components/home/fold-6-evals';
import Header from '@/components/home/header';
import Hero from '@/components/home/hero';
import LogoAnimation from '@/components/home/logo-animation';
import './-styles/base.css';
import { Link, createFileRoute } from '@tanstack/react-router';

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
          <nav className="mt-auto flex flex-col gap-0.5 px-4 py-3">
            {[
              { href: '#install', label: 'Start small' },
              { href: '#providers', label: 'Providers' },
              { href: '#dashboard', label: 'Dashboard' },
              { href: '#observability', label: 'Observability' },
              { href: '#prompts', label: 'Prompts' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-xs font-mono text-[var(--gray9)] hover:text-[var(--gray12)] transition-colors px-2 py-1.5 rounded hover:bg-[var(--gray3)]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="p-4 pt-2">
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
      <div className="grid grid-rows-[auto_1fr] min-w-0">
        <Header />
        <main className="min-w-0">
          <Hero />
          <FoldInstall />
          <FoldProviders />
          <FoldObserve />
          <FoldCosts />
          <FoldPrompts />
          {/*<FoldEvals />*/}

          {/* Footer */}
          <footer className="py-16 px-6 md:px-10 border-t border-gray-4">
            <div className="max-w-xl">
              <p className="text-2xl font-pixel font-semibold text-gray-12 tracking-tight">
                Open source LLMOps for TypeScript teams.
              </p>
              <p className="mt-3 text-sm text-gray-11 leading-relaxed">
                One SDK. Any provider. Full observability. Start building in minutes.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://github.com/nicepkg/llmops"
                  className="text-xs font-mono text-gray-9 hover:text-gray-12 transition-colors"
                >
                  GitHub
                </a>
                <Link
                  to="/docs"
                  className="text-xs font-mono text-gray-9 hover:text-gray-12 transition-colors"
                >
                  Docs
                </Link>
              </div>
            </div>
            <p className="mt-12 text-[11px] font-mono text-gray-8">
              Apache License 2.0
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
