import 'dotenv/config';
import { createApp } from './index';
import { env } from 'node:process';
import { pgStore } from '@llmops/sdk/store/pg';

const { app } = createApp({
  telemetry: env.POSTGRES_URL ? pgStore(env.POSTGRES_URL) : undefined,
  basePath: '/',
});

export default app;
