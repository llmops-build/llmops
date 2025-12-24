import Features from '@/components/home/features';
import './-styles/base.css';
import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';
import Hero from '@/components/home/hero';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <HomeLayout
      {...baseOptions({
        noTitle: true,
      })}
      nav={{ enabled: false }}
    >
      <Hero />
      <Features />
      <footer className="border-t border-gray-4 py-8 px-4 lg:px-8 relative">
        <div className="absolute w-20 aspect-square -top-20">
          <Logo className="w-full h-full dark:invert" />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-10">
          <p>
            &copy; {new Date().getFullYear()} ByteByByte Ventures LLP. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/llmops-build/llmops"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-12 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/8teSTfmEKU"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-12 transition-colors"
            >
              Discord
            </a>
            <a
              href="/docs/getting-started/installation"
              className="hover:text-gray-12 transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </HomeLayout>
  );
}
