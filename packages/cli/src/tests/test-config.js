import { Pool } from 'pg';
import { llmops } from '@llmops/sdk';

export default llmops({
  database: new Pool({
    connectionString: 'postgres://postgres:password@localhost:5432/pg_llmops',
  }),
  basePath: '/llmops',
  providers: {
    openrouter: {
      apiKey: 'sk-yadayadayada',
    },
  },
  auth: {
    type: 'basic',
    defaultUser: 'admin@llmops.local',
    defaultPassword: 'password',
  },
});
