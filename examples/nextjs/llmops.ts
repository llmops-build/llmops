import { llmops, pgStore } from '@llmops/sdk';

export default llmops({
  basePath: '/api/llmops',
  telemetry: pgStore(process.env.POSTGRES_URL || process.env.DATABASE_URL || ''),
});
