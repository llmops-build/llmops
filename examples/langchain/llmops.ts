import 'dotenv/config';
import { llmops } from '@llmops/sdk';
import { pgStore } from '@llmops/sdk/store/pg';
import { env } from 'node:process';

export default llmops({
  basePath: '/llmops',
  telemetry: env.POSTGRES_URL ? pgStore(env.POSTGRES_URL) : undefined,
});
