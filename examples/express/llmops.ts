import { llmops } from '@llmops/sdk';
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
    database: env.POSTGRES_URL || '',
  }),
});
