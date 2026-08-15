'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import FoldAnnotation from './fold-annotation';
import IDEWindow from './ide-window';

gsap.registerPlugin(ScrollTrigger);

const hl = 'block -mx-4 px-4 bg-green-500/10 border-l-2 border-green-500/40';

const configCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { llmops } '}
    <span className="text-accent-11">from</span>
    {" '@llmops/sdk';\n\n"}
    <span className="text-accent-11">export default</span>
    {' llmops({\n'}
    <span className={hl} data-annotation-id="ui-db">
      {'  basePath: '}
      <span className="text-accent-11">'/llmops'</span>
      {',\n'}
    </span>
    <span className={hl}>{'  // Providers auto-detected from env vars'}</span>
    {'\n});'}
  </>
);

const middlewareCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { Hono } '}
    <span className="text-accent-11">from</span>
    {" 'hono';\n"}
    <span className="text-accent-11">import</span>
    {' { createLLMOpsMiddleware } '}
    <span className="text-accent-11">from</span>
    {" '@llmops/sdk/hono';\n"}
    <span className="text-accent-11">import</span>
    {' ops '}
    <span className="text-accent-11">from</span>
    {" './llmops';\n\n"}
    <span className="text-accent-11">const</span>
    {' app = '}
    <span className="text-accent-11">new</span>
    {' Hono();\n\n'}
    <span className={hl} data-annotation-id="ui-middleware">
      {"app.use('/llmops/*', createLLMOpsMiddleware(ops));"}
    </span>
    {'\n\n'}
    <span className="text-accent-11">export default</span>
    {' app;'}
  </>
);

const FoldUI = () => {
  const browserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = browserRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 20, scale: 0.98 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power2.out',
        });
      },
      onLeaveBack: () => {
        gsap.to(el, { opacity: 0, y: 20, scale: 0.98, duration: 0.2 });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="dashboard" className="border-b border-gray-4 overflow-x-clip">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-9 block mb-2">
          {String(3).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-12 tracking-tight">
          Explore Visually
        </h2>
        <p className="mt-3 text-gray-11 text-sm leading-relaxed max-w-xl">
          Mount the middleware and start routing to providers instantly with
          zero configuration.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile */}
        <div className="flex flex-col gap-4 px-4 pb-8 md:hidden">
          <FoldAnnotation
            text="Zero-config setup — providers auto-detected from API key env vars."
            variant="light"
          />
          <IDEWindow tabs={[{ name: 'llmops.ts', content: configCode }]} />
          <FoldAnnotation
            text="Mount the middleware — the dashboard is served automatically."
            variant="light"
          />
          <IDEWindow tabs={[{ name: 'server.ts', content: middlewareCode }]} />
          <div className="rounded-lg border border-gray-4 bg-gray-1 overflow-hidden shadow-md">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-4 bg-gray-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
              </div>
              <div className="flex-1 bg-gray-3 rounded px-3 py-1 text-xs font-mono text-gray-9">
                http://localhost:3000/llmops
              </div>
            </div>
            <div className="aspect-[7/4]">
              <img
                src="/screenshots/dashboard.png"
                alt="LLMOps dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block pb-8 px-10">
          {/* Stacked IDEs + annotations */}
          <div className="flex gap-8 items-stretch">
            <div className="flex-1 max-w-lg">
              <IDEWindow
                tabs={[{ name: 'llmops.ts', content: configCode }]}
              />
              <div className="mt-6">
                <IDEWindow
                  tabs={[{ name: 'server.ts', content: middlewareCode }]}
                />
              </div>
            </div>
            <div className="w-48 shrink-0 flex flex-col pt-8">
              <FoldAnnotation
                text="Zero-config setup — providers auto-detected from API key env vars."
                target="ui-db"
                variant="light"
              />
              <div className="mt-auto">
                <FoldAnnotation
                  text="Mount the middleware — the dashboard is served automatically."
                  target="ui-middleware"
                  delay={0.8}
                  variant="light"
                />
              </div>
            </div>
          </div>

          {/* Browser window — full width reveal */}
          <div
            ref={browserRef}
            className="rounded-lg border border-gray-4 bg-gray-1 overflow-hidden shadow-md mt-10"
            data-annotation-id="dashboard-url"
          >
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-4 bg-gray-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
              </div>
              <div className="flex-1 bg-gray-3 rounded px-3 py-1 text-xs font-mono text-gray-9">
                http://localhost:3000/llmops
              </div>
            </div>
            <div className="aspect-[7/4]">
              <img
                src="/screenshots/dashboard.png"
                alt="LLMOps dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoldUI;
