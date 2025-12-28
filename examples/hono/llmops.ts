import { llmops } from '@llmops/sdk';
import { env } from 'node:process';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',
  providers: {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY || '',
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
});
