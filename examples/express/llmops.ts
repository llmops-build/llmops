import 'dotenv/config';
import { llmops, pgStore } from '@llmops/sdk';
import { env } from 'node:process';

export default llmops({
  basePath: '/llmops',
  telemetry: pgStore(env.POSTGRES_URL || ''),
});
