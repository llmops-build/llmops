import { Kysely as KyselyClass, PostgresDialect, CompiledQuery } from 'kysely';
import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { TelemetryStore } from './interface';
import { createLLMRequestsDataLayer } from '../datalayer/llmRequests';
import { createTracesDataLayer } from '../datalayer/traces';
import { logger } from '../utils/logger';

export type PgStore = TelemetryStore & {
  /** Internal Kysely instance — used by the app to power remaining datalayer queries */
  _db: Kysely<Database>;
};

/**
 * Create a PostgreSQL-backed telemetry store.
 *
 * Usage:
 * ```ts
 * import { llmops, pgStore } from '@llmops/sdk'
 *
 * const ops = llmops({
 *   telemetry: pgStore(process.env.DATABASE_URL),
 * })
 * ```
 */
export function createPgStore(
  connectionString: string,
  options?: { schema?: string },
): PgStore {
  const schema = options?.schema ?? 'llmops';

  let pool: any;
  try {
    // Dynamic import of pg is handled at the module level
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pg = require('pg');
    pool = new pg.Pool({ connectionString });
  } catch {
    throw new Error(
      'pgStore requires the "pg" package. Install it with: pnpm add pg',
    );
  }

  const dialect = new PostgresDialect({
    pool,
    onCreateConnection: async (connection) => {
      await connection.executeQuery(
        CompiledQuery.raw(`SET search_path TO "${schema}"`),
      );
    },
  });

  const db = new KyselyClass<Database>({ dialect });

  const llmRequests = createLLMRequestsDataLayer(db);
  const traces = createTracesDataLayer(db);

  logger.debug(`pgStore: initialized with schema "${schema}"`);

  return {
    ...llmRequests,
    ...traces,
    _db: db,
  };
}
