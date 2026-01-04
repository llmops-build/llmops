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
          // Dynamically import to avoid build-time dependency issues
          const {
            detectDatabaseType,
            runAutoMigrations,
            createDatabaseFromConnection,
          } = await import('@llmops/core/db');

          const rawConnection = config.database;
          const dbType = detectDatabaseType(rawConnection);

          if (!dbType) {
            console.warn(
              '[Migration] Could not detect database type, skipping auto-migration'
            );
            return;
          }

          // Create a fresh Kysely instance for migrations with schema option
          const schema = config.schema ?? 'llmops';
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
