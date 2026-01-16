import { llmops } from '@llmops/sdk';
import { neon } from '@neondatabase/serverless';
// import { Pool } from 'pg';
import { env } from 'node:process';

// Add currentSchema to connection string for Neon serverless
const connectionString = env.NEON_PG_URL?.includes('currentSchema')
  ? env.NEON_PG_URL!
  : `${env.NEON_PG_URL}${env.NEON_PG_URL?.includes('?') ? '&' : '?'}currentSchema=llmops`;

const neonInstance = neon(connectionString);

export default llmops({
  basePath: '/llmops',
  // database: new Pool({
  //   connectionString:
  //     env.NEON_PG_URL ||
  //     // 'postgresql://postgres:password@localhost:5432/pg_llmops',
  //     '',
  // }),
  database: neonInstance,
  // PostgreSQL schema name (defaults to 'llmops')
  schema: 'llmops',
});
