import { Pool } from 'pg';

export default {
  database: new Pool({
    connectionString: 'postgres://user:password@localhost:5432/database',
  }),
  basePath: '/llmops',
  providers: {
    openrouter: {
      apiKey: 'sk-yadayadayada',
    },
  },
};
