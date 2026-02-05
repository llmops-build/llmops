import type { MiddlewareHandler } from 'hono';
import type { LLMOpsConfig } from '@llmops/core';

/**
 * Extended config type with schema option
 */
type LLMOpsConfigWithSchema = LLMOpsConfig & {
  schema?: string;
};

/**
 * Creates a middleware that handles auto-migration on startup
 *
 * This middleware runs once on application startup and automatically
 * runs database migrations if needed.
 *
 * For Neon databases, it uses the idempotent SQL schema approach which
 * works better with stateless HTTP connections.
 *
 * For other databases, it uses the Kysely-based migration system.
 *
 * IMPORTANT: This middleware should run BEFORE the seed middleware
 * but AFTER the database middleware creates the connection.
 */
export const createMigrationMiddleware = (
  config: LLMOpsConfigWithSchema
): MiddlewareHandler => {
  let migrationComplete = false;
  let migrationPromise: Promise<void> | null = null;

  return async (c, next) => {
    // Skip if migrations already complete
    if (migrationComplete) {
      await next();
      return;
    }

    // Use a single promise to prevent race conditions with concurrent requests
    if (!migrationPromise) {
      migrationPromise = (async () => {
        try {
          const { detectDatabaseType } = await import('@llmops/core/db');

          const rawConnection = config.database;
          const dbType = detectDatabaseType(rawConnection);
          const schema = config.schema ?? 'llmops';

          if (!dbType) {
            console.warn(
              '[Migration] Could not detect database type, skipping auto-migration'
            );
            return;
          }

          // For Neon, use the idempotent SQL schema approach
          // This works better with stateless HTTP connections
          if (dbType === 'neon') {
            await runNeonSchemaMigration(rawConnection, schema);
            return;
          }

          // For other databases, use the Kysely-based migration system
          const { runAutoMigrations, createDatabaseFromConnection } =
            await import('@llmops/core/db');

          // Create a fresh Kysely instance for migrations with schema option
          const db = await createDatabaseFromConnection(rawConnection, {
            schema,
          });

          if (!db) {
            console.warn(
              '[Migration] Could not create database connection, skipping auto-migration'
            );
            return;
          }

          const result = await runAutoMigrations(db, dbType, {
            rawConnection,
            schema,
          });

          if (result.ran) {
            console.log(
              `[Migration] Auto-migration completed: ${result.tables.length} table(s) created, ${result.fields.length} field(s) added`
            );
          }
        } catch (error) {
          console.error('[Migration] Auto-migration failed:', error);
          // Don't throw - allow the app to continue, user can run CLI migration
        } finally {
          migrationComplete = true;
        }
      })();
    }

    // Wait for migration to complete before proceeding
    await migrationPromise;
    await next();
  };
};

/**
 * Run schema migration for Neon using idempotent SQL
 *
 * This approach works better with Neon's stateless HTTP connections
 * because it doesn't rely on Kysely's introspection.
 */
async function runNeonSchemaMigration(
  rawConnection: unknown,
  schema: string
): Promise<void> {
  const { runSchemaSQL, createNeonSqlFunction } = await import(
    '@llmops/core/db'
  );

  // Get the sql function from the raw connection
  const sql = await createNeonSqlFunction(rawConnection);

  if (!sql) {
    console.warn(
      '[Migration] Could not create Neon SQL function, skipping schema migration'
    );
    return;
  }

  console.log(
    `[Migration] Running idempotent schema migration for Neon (schema: ${schema})`
  );

  try {
    await runSchemaSQL(sql, schema);
    console.log('[Migration] Schema migration completed successfully');
  } catch (error) {
    console.error('[Migration] Schema migration failed:', error);
    throw error;
  }
}
