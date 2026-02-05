import { llmops } from '@llmops/sdk';
import { Pool } from 'pg';
import { env } from 'node:process';

export default llmops({
  basePath: '/llmops',
  database: new Pool({
    connectionString:
      env.POSTGRES_URL ||
      // 'postgresql://postgres:password@localhost:5432/pg_llmops',
      '',
  }),
  // PostgreSQL schema name (defaults to 'llmops')
  schema: 'llmops-3',
  // Inline provider configurations (optional)
  // These take precedence over database-configured providers
  // Use @slug/model format in requests (e.g., @openai/gpt-4.1-nano)
  providers: [
    {
      provider: 'openai',
      slug: 'openai',
      apiKey: env.OPENAI_API_KEY || '',
    },
    // {
    //   provider: 'anthropic',
    //   slug: 'anthropic',
    //   apiKey: env.ANTHROPIC_API_KEY || '',
    // },
  ],
});
