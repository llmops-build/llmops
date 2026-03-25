import type { MiddlewareHandler } from 'hono';
import type { LLMOpsConfig } from '@llmops/core';

/**
 * Creates a middleware that handles auto-migration on startup.
 *
 * This middleware runs once on application startup and automatically
 * runs database migrations if needed. It uses the telemetry store's
 * internal Kysely instance.
 */
export const createMigrationMiddleware = (
  config: LLMOpsConfig,
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
          // Resolve telemetry store from config
          const telemetry = config.telemetry;
          const store = Array.isArray(telemetry) ? telemetry[0] : telemetry;

          if (!store || !store._db) {
            console.warn(
              '[Migration] No telemetry store with database, skipping auto-migration',
            );
            return;
          }

          const { runAutoMigrations } = await import('@llmops/core/db');

          const result = await runAutoMigrations(store._db, 'postgres', {
            schema: 'llmops',
          });

          if (result.ran) {
            console.log(
              `[Migration] Auto-migration completed: ${result.tables.length} table(s) created, ${result.fields.length} field(s) added`,
            );
          }
        } catch (error) {
          console.error('[Migration] Auto-migration failed:', error);
          // Don't throw - allow the app to continue
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
