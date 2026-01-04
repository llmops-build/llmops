import type { MiddlewareHandler } from 'hono';
import type { LLMOpsConfig } from '@llmops/core';

/**
 * Auto-migrate configuration type
 */
type AutoMigrateConfig = boolean | 'development';

/**
 * Extended config type with autoMigrate and schema options
 */
type LLMOpsConfigWithMigration = LLMOpsConfig & {
  autoMigrate?: AutoMigrateConfig;
  schema?: string;
};

/**
 * Creates a middleware that handles auto-migration based on config
 *
 * This middleware runs once on application startup and handles:
 * - autoMigrate: true - Always run migrations
 * - autoMigrate: false - Never run migrations (default)
 * - autoMigrate: 'development' - Only run when NODE_ENV is 'development'
 *
 * IMPORTANT: This middleware should run BEFORE the seed middleware
 * but AFTER the database middleware creates the connection.
 */
export const createMigrationMiddleware = (
  config: LLMOpsConfigWithMigration
): MiddlewareHandler => {
  let migrationComplete = false;
  let migrationPromise: Promise<void> | null = null;

  return async (c, next) => {
    const autoMigrate = config.autoMigrate ?? false;

    // Skip if migrations already complete or autoMigrate is false
    if (migrationComplete || autoMigrate === false) {
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

          const result = await runAutoMigrations(db, dbType, autoMigrate, {
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
