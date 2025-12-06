import 'dotenv/config';
import { createApp } from './index';
import { env } from 'node:process';

const { app } = createApp({
  basePath: '/',
  providers: {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
    },
  },
});

export default app;
