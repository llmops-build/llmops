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
  schema: 'llmops',
});
