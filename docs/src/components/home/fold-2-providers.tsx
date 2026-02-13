'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import FoldAnnotation from './fold-annotation';
import IDEWindow from './ide-window';

gsap.registerPlugin(ScrollTrigger);

const hl = 'block -mx-4 px-4 bg-green-500/10 border-l-2 border-green-500/40';

const providerCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { llmops } '}
    <span className="text-accent-11">from</span>
    {" '@llmops/sdk';\n\n"}
    <span className="text-accent-11">const</span>
    {' ops = llmops({\n  providers: {\n'}
    <span className={hl} data-annotation-id="provider-slug">
      {'    '}
      <span className="text-gray-9">{"'openai-prod'"}</span>
      {': {'}
    </span>
    {'\n'}
    {'      type: '}
    <span className="text-gray-9">{"'openai'"}</span>
    {',\n'}
    {'      apiKey: process.env.OPENAI_API_KEY,\n'}
    {'    },\n'}
    <span className={hl} data-annotation-id="provider-env">
      {'    '}
      <span className="text-gray-9">{"'anthropic-dev'"}</span>
      {': {'}
    </span>
    {'\n'}
    {'      type: '}
    <span className="text-gray-9">{"'anthropic'"}</span>
    {',\n'}
    {'      apiKey: process.env.ANTHROPIC_API_KEY,\n'}
    {'    },\n  },\n});'}
  </>
);

const providers = [
  { name: 'OpenAI', logo: '/logos/openai.svg' },
  { name: 'Anthropic', logo: '/logos/anthropic.svg' },
  { name: 'Google', logo: '/logos/google.svg' },
  { name: 'Mistral', logo: '/logos/mistral-ai.svg' },
  { name: 'Cohere', logo: '/logos/cohere.svg' },
  { name: 'AWS Bedrock', logo: '/logos/aws-bedrock.svg' },
  { name: 'Azure', logo: '/logos/azure-openai.svg' },
  { name: 'Groq', logo: '/logos/groq.svg' },
  { name: 'DeepSeek', logo: '/logos/deepseek.svg' },
];

const FoldProviders = () => {
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;

    const chips = el.querySelectorAll('[data-chip]');
    gsap.set(chips, { opacity: 0, x: 24 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(chips, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.08,
        });
      },
      onLeaveBack: () => {
        gsap.to(chips, { opacity: 0, x: 24, duration: 0.3 });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="providers" className="border-b border-gray-4 overflow-x-clip">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-9 block mb-2">
          {String(2).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-12 tracking-tight">
          Scale your providers
        </h2>
        <p className="mt-3 text-gray-11 text-sm leading-relaxed max-w-xl">
          Organize multiple LLM providers with custom slugs. One config, many
          models.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile: stacked vertically */}
        <div className="flex flex-col gap-4 px-4 pb-8 md:hidden">
          <FoldAnnotation
            text="Register providers with custom slugs."
            variant="light"
          />
          <IDEWindow tabs={[{ name: 'providers.ts', content: providerCode }]} />
          <div className="flex flex-wrap gap-2 justify-center mt-4 md:mt-0">
            {providers.map(({ name, logo }) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-3 text-gray-11 text-xs font-mono border border-gray-4"
              >
                <img src={logo} alt="" className="w-4 h-4 dark:invert" />
                {name}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full bg-accent-3 text-accent-11 text-xs font-mono border border-accent-4">
              +68 more
            </span>
          </div>
          <p className="text-sm text-gray-11/80 leading-relaxed text-center">
            One config. Any model. Any provider.
          </p>
        </div>

        {/* Desktop: IDE+annotations left, provider chips right */}
        <div className="hidden md:block pb-8 px-10">
          <div className="flex gap-10 items-start">
            {/* Left: IDE + annotations */}
            <div className="flex gap-8 items-start flex-1 min-w-0">
              <div className="flex-1 max-w-lg">
                <IDEWindow
                  tabs={[{ name: 'providers.ts', content: providerCode }]}
                />
              </div>
              <div className="w-48 shrink-0 flex flex-col gap-6 pt-8">
                <FoldAnnotation
                  text="Name your providers with custom slugs."
                  target="provider-slug"
                  variant="light"
                />
                <FoldAnnotation
                  text="Separate credentials per environment."
                  target="provider-env"
                  delay={0.8}
                  variant="light"
                />
              </div>
            </div>

            {/* Right: stacked provider chips */}
            <div
              ref={chipsRef}
              className="w-52 shrink-0 flex flex-col gap-3 pt-4"
            >
              {providers.map(({ name, logo }) => (
                <span
                  key={name}
                  data-chip
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-gray-3 text-gray-11 text-sm font-mono border border-gray-4"
                >
                  <img src={logo} alt="" className="w-5 h-5 dark:invert" />
                  {name}
                </span>
              ))}
              <span
                data-chip
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent-3 text-accent-11 text-sm font-mono border border-accent-4"
              >
                +68 more
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoldProviders;
