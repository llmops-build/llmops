import type { Kysely, Dialect } from 'kysely';
import {
  Kysely as KyselyClass,
  MssqlDialect,
  MysqlDialect,
  PostgresDialect,
  SqliteDialect,
  CompiledQuery,
} from 'kysely';
import type { Database } from './schema';

export * from './schema';
export * from './validation';
export * from './migrations';
export * from './neon-dialect';

/**
 * Supported database types
 */
export type DatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mssql' | 'neon';

/**
 * Options for creating a database connection
 */
export interface DatabaseOptions {
  /**
   * PostgreSQL schema name (sets search_path).
   * Defaults to 'llmops'.
   */
  schema?: string;
}

/**
 * Database connection options
 */
export type DatabaseConnection =
  | { type: 'postgres'; dialect: PostgresDialect }
  | { type: 'mysql'; dialect: MysqlDialect }
  | { type: 'sqlite'; dialect: SqliteDialect }
  | { type: 'mssql'; dialect: MssqlDialect }
  | { type: 'neon'; dialect: Dialect }
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
 * Check if a string looks like a Neon connection string
 */
function isNeonConnectionString(str: string): boolean {
  return (
    str.includes('.neon.tech') ||
    str.includes('neon.tech') ||
    str.includes('@neon-')
  );
}

/**
 * Auto-detect database type from connection object or string
 */
export function detectDatabaseType(db: unknown): DatabaseType | null {
  // Check for connection string
  if (typeof db === 'string') {
    if (isNeonConnectionString(db)) return 'neon';
    if (db.startsWith('postgres://') || db.startsWith('postgresql://'))
      return 'postgres';
    if (db.startsWith('mysql://')) return 'mysql';
    return null;
  }

  if (!db || (typeof db !== 'object' && typeof db !== 'function')) {
    return null;
  }

  // Check for Kysely dialect instances
  if ('createDriver' in db) {
    if (db instanceof SqliteDialect) return 'sqlite';
    if (db instanceof MysqlDialect) return 'mysql';
    if (db instanceof PostgresDialect) return 'postgres';
    if (db instanceof MssqlDialect) return 'mssql';
  }

  // Check for Neon serverless instance (neon() function)
  if (typeof db === 'function' && db.name === 'templateFn') {
    return 'neon';
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
 *
 * @param rawConnection - The raw database connection (pg Pool, sqlite Database, etc.)
 * @param options - Optional configuration (schema for PostgreSQL)
 */
export async function createDatabaseFromConnection(
  rawConnection: any,
  options?: DatabaseOptions
): Promise<Kysely<Database> | null> {
  const dbType = detectDatabaseType(rawConnection);
  if (!dbType) {
    return null;
  }

  let dialect: Dialect | undefined;
  const schema = options?.schema ?? 'llmops';

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
      dialect = new PostgresDialect({
        pool: rawConnection,
        onCreateConnection: async (connection) => {
          // Set search_path on every new connection
          await connection.executeQuery(
            CompiledQuery.raw(`SET search_path TO "${schema}"`)
          );
        },
      });
      break;

    case 'neon': {
      // If user passed a neon() function instance, use it directly
      if (typeof rawConnection === 'function') {
        const { createNeonDialect } = await import('./neon-dialect');
        dialect = createNeonDialect(rawConnection);
        break;
      }

      // User passed a connection string, or get from environment variables
      const connectionString =
        (typeof rawConnection === 'string' && rawConnection) ||
        process.env.NEON_CONNECTION_STRING ||
        process.env.NEON_PG_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        '';

      if (!connectionString) {
        throw new Error(
          'Neon connection string is required. Pass it directly as the database option ' +
            'or set one of: NEON_CONNECTION_STRING, NEON_PG_URL, DATABASE_URL, POSTGRES_URL'
        );
      }

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(connectionString);
      const { createNeonDialect } = await import('./neon-dialect');
      dialect = createNeonDialect(sql);
      break;
    }

    case 'mssql':
      if ('createDriver' in rawConnection) {
        dialect = rawConnection;
      }
      break;
  }

  return dialect ? new KyselyClass<Database>({ dialect }) : null;
}
