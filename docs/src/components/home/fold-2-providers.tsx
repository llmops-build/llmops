'use client';

import Fold from './fold';
import IDEWindow from './ide-window';
import TerminalWindow from './terminal-window';

const providerCode = (
  <>
    <span className="text-accent-11">import</span>
    {' { llmops } '}
    <span className="text-accent-11">from</span>
    {" '@llmops/sdk';\n\n"}
    <span className="text-accent-11">const</span>
    {' ops = llmops({\n  providers: {\n    '}
    <span className="text-gray-9">'openai-prod'</span>
    {': {\n      type: '}
    <span className="text-gray-9">'openai'</span>
    {',\n      apiKey: process.env.OPENAI_API_KEY,\n    },\n    '}
    <span className="text-gray-9">'anthropic-dev'</span>
    {': {\n      type: '}
    <span className="text-gray-9">'anthropic'</span>
    {',\n      apiKey: process.env.ANTHROPIC_API_KEY,\n    },\n  },\n});'}
  </>
);

const curlCommand = `curl http://localhost:3000/llmops/api/genai/v1/chat/completions -H "Authorization: Bearer $ENV_SECRET" -d '{"model": "@openai-prod/gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}'`;

const FoldProviders = () => {
  return (
    <Fold
      number={2}
      title="Add Providers"
      description="Register multiple LLM providers with custom slugs. Route requests to any model through a unified API."
    >
      <div className="flex flex-col gap-6 max-w-2xl mx-auto px-4 md:px-0">
        <IDEWindow
          tabs={[{ name: 'providers.ts', content: providerCode }]}
        />
        <TerminalWindow command={curlCommand} />
        <p className="text-sm text-gray-11 leading-relaxed">
          Use provider slugs like{' '}
          <code className="font-mono text-xs bg-gray-3 px-1.5 py-0.5 rounded">
            @openai-prod/gpt-4o
          </code>{' '}
          to route requests. Each provider gets its own credentials and
          configuration.
        </p>
      </div>
    </Fold>
  );
};

export default FoldProviders;
