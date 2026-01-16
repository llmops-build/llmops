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
 * Auto-detect database type from connection object
 */
export function detectDatabaseType(db: unknown): DatabaseType | null {
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

  // Check for Neon serverless instance
  if (typeof db === 'function' && db.name === 'templateFn') {
    // Neon instances are functions that return connection pools
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

    case 'neon':
      // For Neon with schema requirements, use WebSocket connection instead of HTTP
      // to maintain search_path state
      if (schema && schema !== 'public') {
        const { Pool, neonConfig } = await import('@neondatabase/serverless');
        const { default: ws } = await import('ws');
        neonConfig.webSocketConstructor = ws;

        // Create WebSocket connection for stateful schema support
        const connectionString =
          typeof rawConnection === 'string'
            ? rawConnection
            : process.env.NEON_PG_URL || '';

        const pool = new Pool({
          connectionString: connectionString.includes('currentSchema')
            ? connectionString.split('currentSchema=')[1].split('&')[0] ===
              'public'
              ? connectionString.replace(/currentSchema=[^&]*&?/, '')
              : connectionString
            : connectionString,
        });

        dialect = new PostgresDialect({
          pool,
          onCreateConnection: async (connection) => {
            // Set search_path on every new connection
            await connection.executeQuery(
              CompiledQuery.raw(`SET search_path TO "${schema}"`)
            );
          },
        });
      } else {
        // Use standard HTTP Neon connection for public schema
        const { createNeonDialect } = await import('./neon-dialect');
        dialect = createNeonDialect(rawConnection);
      }
      break;

    case 'mssql':
      if ('createDriver' in rawConnection) {
        dialect = rawConnection;
      }
      break;
  }

  return dialect ? new KyselyClass<Database>({ dialect }) : null;
}
