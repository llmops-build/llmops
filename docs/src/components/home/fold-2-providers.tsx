'use client';

import FoldAnnotation from './fold-annotation';
import IDEWindow from './ide-window';
import TerminalWindow from './terminal-window';

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

const curlCommand = `curl localhost:3000/llmops/v1/chat/completions -d '{"model":"@openai-prod/gpt-4o"}'`;

const FoldProviders = () => {
  return (
    <section className="border-b border-gray-4 overflow-x-clip">
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
          <FoldAnnotation text="Register providers with custom slugs." variant="light" />
          <IDEWindow
            tabs={[{ name: 'providers.ts', content: providerCode }]}
          />
          <FoldAnnotation text="Use slugs to route requests." variant="light" />
          <TerminalWindow command={curlCommand} />
          <div className="flex flex-wrap gap-2 justify-center mt-4">
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

        {/* Desktop: side-by-side with annotations */}
        <div className="hidden md:block pb-8 px-10">
          <div className="flex gap-8 items-start max-w-3xl mx-auto">
            <div className="flex-1 max-w-lg">
              <IDEWindow
                tabs={[{ name: 'providers.ts', content: providerCode }]}
              />
              <div className="mt-6">
                <TerminalWindow command={curlCommand} />
              </div>
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
          <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-2xl mx-auto">
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
          <p className="text-sm text-gray-11/80 leading-relaxed text-center py-8 px-6">
            One config. Any model. Any provider.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FoldProviders;
