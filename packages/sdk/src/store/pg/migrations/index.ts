/**
 * Migration registry — imports are inlined at build time by the sql-loader plugin.
 * Each entry is a [name, sql] tuple, ordered by filename.
 */
import migration_001 from './000001_2191b051.sql';

export const migrations: [name: string, sql: string][] = [
  ['000001_2191b051', migration_001],
];
