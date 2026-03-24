import 'dotenv/config';
import { createApp } from './index';
import { env } from 'node:process';
import { createPgStore } from '@llmops/core';

const { app } = createApp({
  telemetry: createPgStore(env.POSTGRES_URL || ''),
  basePath: '/',
});

export default app;
