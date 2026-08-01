import { llmops } from '@llmops/sdk';
import { pgStore } from '@llmops/sdk/store/pg';

export default llmops({
  basePath: '/api/llmops',
  telemetry: (process.env.POSTGRES_URL || process.env.DATABASE_URL)
    ? pgStore(process.env.POSTGRES_URL || process.env.DATABASE_URL!)
    : undefined,
});
