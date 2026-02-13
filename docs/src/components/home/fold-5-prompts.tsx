'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import IDEWindow from './ide-window';

gsap.registerPlugin(ScrollTrigger);

const hl = 'block -mx-4 px-4 bg-green-500/10 border-l-2 border-green-500/40';

const promptCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { streamText } '}
    <span className="text-accent-11">from</span>
    {" 'ai';\n"}
    <span className="text-accent-11">import</span>
    {' { openai } '}
    <span className="text-accent-11">from</span>
    {" './providers';\n\n"}
    <span className="text-accent-11">const</span>
    {' result = '}
    <span className="text-accent-11">await</span>
    {' streamText({\n'}
    {'  model: openai.chat('}
    <span className="text-gray-9">{"'@openai/gpt-4o'"}</span>
    {'),\n'}
    {'  headers: {\n'}
    <span className={hl}>
      {'    '}
      <span className="text-gray-9">{"'x-llmops-prompt'"}</span>
      {': '}
      <span className="text-gray-9">{"'my-chatbot-prompt'"}</span>
      {','}
    </span>
    {'\n  },\n'}
    <span className={hl}>
      {'  variables: { userName: '}
      <span className="text-gray-9">{"'Alice'"}</span>
      {' },'}
    </span>
    {'\n});'}
  </>
);

const versions = [
  {
    version: 'v3',
    model: 'GPT 4o',
    logo: '/logos/openai.svg',
    prompt: 'You are a helpful assistant. Greet {{userName}} warmly and ask how you can help today.',
    active: true,
  },
  {
    version: 'v2',
    model: 'Gemini 2.5 Flash',
    logo: '/logos/google.svg',
    prompt: 'Assist {{userName}} with their query. Be concise and friendly.',
    active: false,
  },
  {
    version: 'v1',
    model: 'Claude Sonnet 4.5',
    logo: '/logos/anthropic.svg',
    prompt: 'You are a chatbot. Help the user.',
    active: false,
  },
];

const VersionTimeline = () => {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const cards = el.querySelectorAll('[data-version-card]');
    gsap.set(cards, { opacity: 0, x: 20 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      onEnter: () => {
        gsap.to(cards, {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.15,
        });
      },
      onLeaveBack: () => {
        gsap.to(cards, { opacity: 0, x: 20, duration: 0.2 });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div ref={timelineRef} className="relative pl-10">
      {/* Dotted vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px border-l border-dashed border-gray-6" />

      <div className="flex flex-col gap-6">
        {versions.map((v) => (
          <div key={v.version} data-version-card className="relative flex items-start gap-4">
            {/* Version badge */}
            <div className={`absolute -left-10 top-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0 ${
              v.active
                ? 'bg-accent-9 text-gray-1'
                : 'bg-gray-4 text-gray-9'
            }`}>
              {v.version}
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-lg border p-4 ${
              v.active
                ? 'border-accent-6 bg-accent-2'
                : 'border-gray-4 bg-gray-2'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <img src={v.logo} alt="" className="w-4 h-4" />
                <span className="text-sm font-mono font-medium text-gray-12">{v.model}</span>
                {v.active && (
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-accent-3 text-accent-11 px-1.5 py-0.5 rounded ml-auto">
                    active
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-gray-9 leading-relaxed">
                {v.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FoldPrompts = () => {
  return (
    <section id="prompts" className="border-b border-gray-4">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-9 block mb-2">
          {String(5).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-12 tracking-tight">
          Version Your Prompts
        </h2>
        <p className="mt-3 text-gray-11 text-sm leading-relaxed max-w-xl">
          Manage prompts from the UI and iterate without redeploying. Reference them by name in your API calls.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile: stacked */}
        <div className="flex flex-col gap-6 px-4 pb-8 md:hidden">
          <VersionTimeline />
          <IDEWindow tabs={[{ name: 'app.ts', content: promptCode }]} />
        </div>

        {/* Desktop: two columns — timeline left, code right */}
        <div className="hidden md:grid md:grid-cols-[320px_1fr] gap-8 px-10 pb-8 items-start">
          <VersionTimeline />
          <IDEWindow tabs={[{ name: 'app.ts', content: promptCode }]} />
        </div>
      </div>
    </section>
  );
};

export default FoldPrompts;
