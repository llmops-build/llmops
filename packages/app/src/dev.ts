import 'dotenv/config';
import { createApp } from './index';
import { env } from 'node:process';
import { Pool } from 'pg';

const { app } = createApp({
  database: new Pool({
    connectionString: env.POSTGRES_URL || '',
  }),
  basePath: '/',
});

export default app;
