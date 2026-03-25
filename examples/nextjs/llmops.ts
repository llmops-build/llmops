import { llmops } from '@llmops/sdk';
import { pgStore } from '@llmops/sdk/store/pg';

export default llmops({
  basePath: '/api/llmops',
  telemetry: pgStore(process.env.POSTGRES_URL || process.env.DATABASE_URL || ''),
});
