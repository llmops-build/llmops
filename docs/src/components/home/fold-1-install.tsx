'use client';

import BrowserWindow from './browser-window';
import Fold from './fold';
import IDEWindow from './ide-window';
import TerminalWindow from './terminal-window';

const hl = 'block -mx-4 px-4 bg-green-500/10 border-l-2 border-green-500/40';

const serverCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { Hono } '}
    <span className="text-accent-11">from</span>
    {" 'hono';\n"}
    <span className="text-accent-11">import</span>
    {' { stream } '}
    <span className="text-accent-11">from</span>
    {" 'hono/streaming';\n"}
    <span className="text-accent-11">import</span>
    {' { streamText } '}
    <span className="text-accent-11">from</span>
    {" 'ai';\n"}
    <span className="text-accent-11">import</span>
    {' { createOpenAI } '}
    <span className="text-accent-11">from</span>
    {" '@ai-sdk/openai';\n"}
    <span className={hl}>
      <span className="text-accent-11">import</span>
      {' { llmops } '}
      <span className="text-accent-11">from</span>
      {" '@llmops/sdk';"}
    </span>
    {'\n'}
    <span className={hl}>
      <span className="text-accent-11">const</span>
      {' llmopsClient = llmops();'}
    </span>
    {'\n'}
    <span className={hl}>
      <span className="text-accent-11">const</span>
      {' openai = createOpenAI(llmopsClient.provider());'}
    </span>
    {'\n'}
    <span className="text-accent-11">const</span>
    {' app = '}
    <span className="text-accent-11">new</span>
    {' Hono();\n\n'}
    {'app.get('}
    <span className="text-gray-9">{"'/'"}</span>
    {', '}
    <span className="text-accent-11">async</span>
    {' (c) => {\n'}
    {'  '}
    <span className="text-accent-11">const</span>
    {' result = streamText({\n'}
    <span className={hl}>
      {'    model: openai.chat('}
      <span className="text-gray-9">{"'@google/gemini-2.5-flash'"}</span>
      {'),'}
    </span>
    {'\n'}
    {'    prompt: '}
    <span className="text-gray-9">{"'What model are you?'"}</span>
    {',\n  });\n\n'}
    {'  '}
    <span className="text-accent-11">return</span>
    {' stream(c, '}
    <span className="text-accent-11">async</span>
    {' (stream) => {\n'}
    {'    '}
    <span className="text-accent-11">for await</span>
    {' ('}
    <span className="text-accent-11">const</span>
    {' part '}
    <span className="text-accent-11">of</span>
    {' result.textStream) {\n'}
    {'      '}
    <span className="text-accent-11">await</span>
    {' stream.write(part);\n'}
    {'    }\n  });\n});'}
  </>
);

const envCode = (
  <>
    <span className="text-gray-9"># Add your provider keys</span>
    {'\n'}
    {'OPENAI_API_KEY='}
    <span className="text-gray-9">sk-...</span>
  </>
);

const FoldInstall = () => {
  return (
    <section className="border-b border-gray-4 bg-accent-8">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-5 block mb-2">
          {String(1).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-1 tracking-tight">
          Start small!
        </h2>
        <p className="mt-3 text-gray-2 text-sm leading-relaxed max-w-xl">
          One package. That's all you require to get started.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile: stacked vertically */}
        <div className="flex flex-col gap-6 px-4 pb-8 md:hidden">
          <TerminalWindow command="npm i @llmops/sdk" />
          <IDEWindow
            tabs={[
              { name: 'server.ts', content: serverCode },
              { name: '.env', content: envCode },
            ]}
          />
          <BrowserWindow />
        </div>

        {/* Desktop: overlapping sticky cards */}
        <div className="h-[250vh] relative hidden md:block">
          <div className="h-[calc(250vh-var(--spacing)*80)] w-full absolute top-80 z-0 max-w-3xl right-1/2 translate-x-1/2">
            <div className="sticky top-96 width-36 h-[calc(100vh-var(--spacing)*96)]">
              <BrowserWindow />
            </div>
          </div>
          <div className="w-full max-w-lg absolute top-48 z-20 h-[calc(100vh-var(--spacing)*48)] left-1/3 -translate-x-1/2">
            <div className="sticky top-64">
              <IDEWindow
                tabs={[
                  { name: 'server.ts', content: serverCode },
                  { name: '.env', content: envCode },
                ]}
              />
            </div>
          </div>
          <div className="h-36 absolute top-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm">
            <div className="sticky top-0 w-full flex flex-col justify-start items-center">
              <div className="w-full max-w-sm mt-12">
                <TerminalWindow command="npm i @llmops/sdk" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoldInstall;
