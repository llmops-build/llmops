import 'dotenv/config';
import { createApp } from './index';
import { env } from 'node:process';
import { Pool } from 'pg';

const { app } = createApp({
  database: new Pool({
    connectionString: env.POSTGRES_URL || '',
  }),
  basePath: '/',
  providers: {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
    },
  },
});

export default app;
