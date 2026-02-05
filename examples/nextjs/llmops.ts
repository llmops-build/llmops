import { llmops } from '@llmops/sdk';

// For Neon, just pass the connection string directly
// The SDK will auto-detect it as Neon and handle it appropriately
export default llmops({
  basePath: '/api/llmops',
  database: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
  schema: 'llmops',
});
