/**
 * Database Adapter Module
 *
 * This module provides a pluggable database adapter system for LLMOps.
 * It allows using different database backends (Kysely/pg, Convex, MongoDB, etc.)
 * while maintaining a consistent API.
 *
 * @example Default usage (pg Pool - backward compatible)
 * ```ts
 * import { Pool } from 'pg';
 * import { initLLMOps } from '@llmops/sdk';
 *
 * const pool = new Pool({ connectionString: DATABASE_URL });
 * const llmops = initLLMOps({ database: pool });
 * ```
 *
 * @example With Convex adapter
 * ```ts
 * import { createConvexAdapter } from '@llmops/sdk/convex';
 * import { initLLMOps } from '@llmops/sdk';
 *
 * const adapter = createConvexAdapter({ client: convexClient });
 * const llmops = initLLMOps({ database: adapter });
 * ```
 */

// Export all types
export type {
  AdapterCapabilities,
  WhereOperator,
  WhereCondition,
  Where,
  SortDirection,
  SortBy,
  QueryOptions,
  AggregateFunction,
  AggregateField,
  AggregateOptions,
  BatchResult,
  BaseEntity,
  DatabaseAdapter,
  AdapterMigrationResult,
  MigrationAdapter,
} from './types';

// Export utilities and constants
export {
  SQL_ADAPTER_CAPABILITIES,
  NOSQL_ADAPTER_CAPABILITIES,
  isDatabaseAdapter,
  where,
} from './types';

// Export Kysely adapter
export { createKyselyAdapter, KyselyAdapter } from './kysely-adapter';

// Export client-side aggregation helpers
export {
  clientAggregate,
  clientCount,
  clientSum,
  clientAvg,
  clientMin,
  clientMax,
  clientGroupBy,
} from './client-aggregations';
