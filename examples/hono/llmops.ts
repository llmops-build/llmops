import { llmops } from '@llmops/sdk';
import { env } from 'node:process';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',
  database: new Pool({
    connectionString: env.POSTGRES_URL || '',
  }),
  // PostgreSQL schema name (defaults to 'llmops')
  schema: 'llmops',
});
