import type { MiddlewareHandler } from 'hono';
import type { LLMOpsConfig } from '@llmops/core';
import type { Pool } from 'pg';

/**
 * Creates a middleware that handles auto-migration on startup.
 *
 * Runs once on the first request. Uses the pgStore's pool and
 * the SDK's migration runner (plain SQL, no Kysely).
 */
export const createMigrationMiddleware = (
  config: LLMOpsConfig,
): MiddlewareHandler => {
  let migrationComplete = false;
  let migrationPromise: Promise<void> | null = null;

  return async (c, next) => {
    if (migrationComplete) {
      await next();
      return;
    }

    if (!migrationPromise) {
      migrationPromise = (async () => {
        try {
          const telemetry = config.telemetry;
          const store = Array.isArray(telemetry) ? telemetry[0] : telemetry;

          if (!store || !store._pool) {
            console.warn(
              '[Migration] No telemetry store with pool, skipping auto-migration',
            );
            return;
          }

          const { runMigrations } = await import('@llmops/sdk/store/pg');
          const { applied } = await runMigrations(
            store._pool as Pool,
            store._schema ?? 'llmops',
          );

          if (applied.length > 0) {
            console.log(
              `[Migration] Applied ${applied.length} migration(s): ${applied.join(', ')}`,
            );
          }
        } catch (error) {
          console.error('[Migration] Auto-migration failed:', error);
        } finally {
          migrationComplete = true;
        }
      })();
    }

    await migrationPromise;
    await next();
  };
};
