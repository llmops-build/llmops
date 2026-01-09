import { llmops } from '@llmops/sdk';
import { Pool } from 'pg';

export default llmops({
  basePath: '/',
  database: new Pool({
    connectionString: process.env.POSTGRES_URL || '',
  }),
});
