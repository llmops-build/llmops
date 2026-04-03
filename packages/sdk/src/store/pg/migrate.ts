import type { Pool } from 'pg';
import { migrations } from './migrations';

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _llmops_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

/**
 * Run pending migrations against the database.
 *
 * - Creates the _llmops_migrations tracking table if it doesn't exist
 * - Skips already-applied migrations
 * - Applies new migrations in order
 */
export async function runMigrations(
  pool: Pool,
  schema: string,
): Promise<{ applied: string[] }> {
  // Ensure schema exists
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await pool.query(`SET search_path TO "${schema}"`);

  // Create tracking table
  await pool.query(MIGRATIONS_TABLE);

  // Get already-applied migrations
  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM _llmops_migrations ORDER BY name',
  );
  const applied = new Set(rows.map((r) => r.name));

  // Apply pending migrations
  const newlyApplied: string[] = [];

  for (const [name, sql] of migrations) {
    if (applied.has(name)) continue;

    await pool.query(sql);
    await pool.query(
      'INSERT INTO _llmops_migrations (name) VALUES ($1)',
      [name],
    );
    newlyApplied.push(name);
  }

  return { applied: newlyApplied };
}
