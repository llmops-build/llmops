import { llmops } from '@llmops/sdk';
import { neon } from '@neondatabase/serverless';

// Use Neon serverless driver for Next.js
// The connection string should be in POSTGRES_URL or DATABASE_URL
const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || '');

export default llmops({
  basePath: '/api/llmops',
  database: sql,
  schema: 'llmops',
});
