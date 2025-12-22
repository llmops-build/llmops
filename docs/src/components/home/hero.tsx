import { clsx } from 'clsx';
import { Link } from '@tanstack/react-router';
import CodeEditor from './code-editor';
import styles from './home.module.css';

const tabs = [
  {
    name: 'llmops.ts',
    code: `import { llmops } from '@llmops/sdk';
import { env } from 'node:process';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',
  providers: {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
    },
  },
  database: new Pool({
    connectionString: env.POSTGRES_URL || '',
  }),
  auth: {
    type: 'basic',
    defaultUser: 'admin@llmops.local',
    defaultPassword: 'password',
  },
});`,
  },
  {
    name: 'server.ts',
    code: `import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk';
import llmopsClient from './llmops';

const app = express();
const llmops = createLLMOpsMiddleware(llmopsClient);

app.use('/llmops', llmops);

app.listen(3000);`,
  },
];

const Hero = () => {
  return (
    <div
      className={clsx(
        'max-w-6xl mx-auto flex w-full items-center justify-stretch h-full px-4 lg:px-8',
        styles.hero
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full gap-8">
        <div className="flex flex-col gap-6 max-w-md justify-center">
          <h1 className="text-2xl text-gray-11 text-pretty font-normal">
            A pluggable <span className="text-gray-12">LLMOps</span> toolkit for
            TypeScript applications
          </h1>
          <div className="w-full max-w-xs px-3 border flex gap-3 border-solid border-gray-4 h-10 rounded-md">
            <span className="text-gray-8 leading-10">~</span>
            <div className="font-mono leading-10 text-gray-12 text-sm">
              <span>npm i </span>
              <span className="text-accent-9">@llmops/sdk</span>
            </div>
          </div>
          <div>
            <Link
              to="/docs/$"
              params={{
                // @ts-expect-error Expected
                '*': 'getting-started/installation',
              }}
              className="bg-accent-10 text-gray-12 px-3 py-2 rounded-sm"
            >
              Get Started &rarr;
            </Link>
          </div>
        </div>
        <div className="flex items-center">
          <CodeEditor tabs={tabs} className="w-full h-80" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
