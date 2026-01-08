import { llmops } from '@llmops/sdk';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',
  database: new Pool({
    connectionString: process.env.POSTGRES_URL || '',
  }),
  schema: 'llmops',
});