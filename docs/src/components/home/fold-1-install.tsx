'use client';

import ChatWindow from './chat-window';
import Fold from './fold';
import IDEWindow from './ide-window';
import TerminalWindow from './terminal-window';

const serverCode = (
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
    {' { llmops } '}
    <span className="text-accent-11">from</span>
    {" '@llmops/sdk';\n\n"}
    <span className="text-accent-11">const</span>
    {' app = '}
    <span className="text-accent-11">new</span>
    {' Hono();\n\n'}
    {'app.use('}
    <span className="text-gray-9">{`'/llmops/*'`}</span>
    {', createLLMOpsMiddleware(\n  llmops({ basePath: '}
    <span className="text-gray-9">{`'/llmops'`}</span>
    {' })\n));\n\n'}
    <span className="text-accent-11">export default</span>
    {' app;'}
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

const clientCode = (
  <>
    <span className="text-accent-11">import</span>
    {' OpenAI '}
    <span className="text-accent-11">from</span>
    {" 'openai';\n\n"}
    <span className="text-accent-11">const</span>
    {' openai = '}
    <span className="text-accent-11">new</span>
    {' OpenAI({\n  baseURL: '}
    <span className="text-gray-9">
      {"'http://localhost:3000/llmops/api/genai/v1'"}
    </span>
    {',\n});\n\n'}
    <span className="text-accent-11">export default</span>
    {' openai;'}
  </>
);

const FoldInstall = () => {
  return (
    <Fold
      number={1}
      title="Start small!"
      description="One package. That's all you require to get started."
    >
      <div className="h-[500vh] relative">
        <div className="h-[300vh] w-full absolute top-0 z-0">
          <div className="sticky top-96 width-36 h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ">
              <IDEWindow tabs={[{ name: 'client.ts', content: clientCode }]} />
              <ChatWindow />
            </div>
          </div>
        </div>
        <div className="w-full max-w-lg absolute top-0 z-20 h-screen">
          <div className="sticky top-64">
            <IDEWindow
              tabs={[
                { name: 'server.ts', content: serverCode },
                { name: '.env', content: envCode },
              ]}
            />
          </div>
        </div>
        <div className="h-36 absolute top-0 z-30 w-full max-w-sm">
          <div className="sticky top-0 w-full flex flex-col justify-start items-center">
            <div className="w-full max-w-sm mt-12">
              <TerminalWindow command="npm i @llmops/sdk" />
            </div>
          </div>
        </div>
      </div>
    </Fold>
  );
};

export default FoldInstall;
