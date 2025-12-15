import type { Kysely, Dialect } from 'kysely';
import {
  Kysely as KyselyClass,
  MssqlDialect,
  MysqlDialect,
  PostgresDialect,
  SqliteDialect,
} from 'kysely';
import type { Database } from './schema';

export * from './schema';
export * from './validation';

/**
 * Supported database types
 */
export type DatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mssql';

/**
 * Database connection options
 */
export type DatabaseConnection =
  | { type: 'postgres'; dialect: PostgresDialect }
  | { type: 'mysql'; dialect: MysqlDialect }
  | { type: 'sqlite'; dialect: SqliteDialect }
  | { type: 'mssql'; dialect: MssqlDialect }
  | { type: DatabaseType; kysely: Kysely<Database> };

/**
 * Create a Kysely database instance with type safety
 */
export function createDatabase(
  connection: DatabaseConnection
): Kysely<Database> {
  if ('kysely' in connection) {
    return connection.kysely;
  }

  return new KyselyClass<Database>({
    dialect: connection.dialect,
  });
}

/**
 * Auto-detect database type from connection object
 */
export function detectDatabaseType(db: unknown): DatabaseType | null {
  if (!db || typeof db !== 'object') {
    return null;
  }

  // Check for Kysely dialect instances
  if ('createDriver' in db) {
    if (db instanceof SqliteDialect) return 'sqlite';
    if (db instanceof MysqlDialect) return 'mysql';
    if (db instanceof PostgresDialect) return 'postgres';
    if (db instanceof MssqlDialect) return 'mssql';
  }

  // Check for raw connection objects
  if ('aggregate' in db) return 'sqlite';
  if ('getConnection' in db) return 'mysql';
  if ('connect' in db) return 'postgres';
  if ('fileControl' in db) return 'sqlite';
  if ('open' in db && 'close' in db && 'prepare' in db) return 'sqlite';

  return null;
}

/**
 * Create database from raw connection
 */
export async function createDatabaseFromConnection(
  rawConnection: any
): Promise<Kysely<Database> | null> {
  const dbType = detectDatabaseType(rawConnection);

  if (!dbType) {
    return null;
  }

  let dialect: Dialect | undefined;

  switch (dbType) {
    case 'sqlite':
      if ('aggregate' in rawConnection && !('createSession' in rawConnection)) {
        dialect = new SqliteDialect({ database: rawConnection });
      } else if ('fileControl' in rawConnection) {
        const { BunSqliteDialect } = await import('./bun-sqlite-dialect');
        dialect = new BunSqliteDialect({ database: rawConnection });
      } else if (
        'createSession' in rawConnection &&
        typeof window === 'undefined'
      ) {
        try {
          const { DatabaseSync } = await import('node:sqlite');
          if (rawConnection instanceof DatabaseSync) {
            const { NodeSqliteDialect } = await import('./node-sqlite-dialect');
            dialect = new NodeSqliteDialect({ database: rawConnection });
          }
        } catch {
          // Node.js SQLite not available
        }
      }
      break;

    case 'mysql':
      dialect = new MysqlDialect(rawConnection);
      break;

    case 'postgres':
      dialect = new PostgresDialect({ pool: rawConnection });
      break;

    case 'mssql':
      if ('createDriver' in rawConnection) {
        dialect = rawConnection;
      }
      break;
  }

  return dialect ? new KyselyClass<Database>({ dialect }) : null;
}
