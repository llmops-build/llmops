import type { D1Database } from './types';
import { migrations } from './migrations';

/**
 * Run pending migrations against a D1 database.
 */
export async function runD1Migrations(
  db: D1Database,
): Promise<{ applied: string[] }> {
  // Create tracking table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS _llmops_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  // Get already-applied migrations
  const { results } = await db.prepare(
    'SELECT name FROM _llmops_migrations ORDER BY name',
  ).all<{ name: string }>();
  const applied = new Set(results.map((r) => r.name));

  const newlyApplied: string[] = [];

  for (const [name, sql] of migrations) {
    if (applied.has(name)) continue;

    // Split multi-statement SQL and run via batch
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => db.prepare(s));

    statements.push(
      db.prepare('INSERT INTO _llmops_migrations (name) VALUES (?)').bind(name),
    );

    await db.batch(statements);
    newlyApplied.push(name);
  }

  return { applied: newlyApplied };
}
