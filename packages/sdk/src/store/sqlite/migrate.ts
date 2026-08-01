import type { SQLiteDatabase } from './types';
import { migrations } from './migrations';

/**
 * Run pending migrations against a SQLite database.
 */
export function runSQLiteMigrations(
  db: SQLiteDatabase,
): { applied: string[] } {
  // Create tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _llmops_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get already-applied migrations
  const rows = db.prepare(
    'SELECT name FROM _llmops_migrations ORDER BY name',
  ).all() as { name: string }[];
  const applied = new Set(rows.map((r) => r.name));

  const newlyApplied: string[] = [];

  for (const [name, sql] of migrations) {
    if (applied.has(name)) continue;

    // Execute multi-statement migration
    db.exec(sql);
    db.prepare(
      'INSERT INTO _llmops_migrations (name) VALUES (?)',
    ).run(name);
    newlyApplied.push(name);
  }

  return { applied: newlyApplied };
}
