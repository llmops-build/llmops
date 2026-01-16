/**
 * Database Adapter Types
 *
 * This module defines the core interfaces for the pluggable database adapter system.
 * Adapters implement these interfaces to provide database functionality for different
 * backends (Kysely/pg, Convex, MongoDB, Drizzle, Prisma, etc.)
 */

import type { TableName } from '../db/schema';

/**
 * Adapter capabilities indicating what features the database supports
 */
export interface AdapterCapabilities {
  /** Whether the database supports JSON/JSONB fields natively */
  supportsJSON: boolean;
  /** Whether the database supports transactions */
  supportsTransactions: boolean;
  /** Whether the database supports RETURNING clause */
  supportsReturning: boolean;
  /** Whether the database supports JOIN operations */
  supportsJoins: boolean;
  /** Whether the database supports aggregations (SUM, COUNT, AVG, etc.) */
  supportsAggregations: boolean;
  /** Whether the database supports batch/bulk insert */
  supportsBatchInsert: boolean;
}

/**
 * Default capabilities for SQL databases (Postgres, MySQL, SQLite)
 */
export const SQL_ADAPTER_CAPABILITIES: AdapterCapabilities = {
  supportsJSON: true,
  supportsTransactions: true,
  supportsReturning: true,
  supportsJoins: true,
  supportsAggregations: true,
  supportsBatchInsert: true,
};

/**
 * Default capabilities for NoSQL databases (Convex, MongoDB)
 */
export const NOSQL_ADAPTER_CAPABILITIES: AdapterCapabilities = {
  supportsJSON: true,
  supportsTransactions: false,
  supportsReturning: true,
  supportsJoins: false,
  supportsAggregations: false,
  supportsBatchInsert: true,
};

/**
 * Supported comparison operators for where conditions
 */
export type WhereOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null';

/**
 * A single where condition
 */
export interface WhereCondition {
  field: string;
  operator: WhereOperator;
  value: unknown;
}

/**
 * Where clause as an array of conditions (AND logic)
 */
export type Where = WhereCondition[];

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification for a single field
 */
export interface SortBy {
  field: string;
  direction: SortDirection;
}

/**
 * Query options for findOne and findMany operations
 */
export interface QueryOptions {
  /** Filter conditions (AND logic) */
  where?: Where;
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
  /** Sort order */
  orderBy?: SortBy | SortBy[];
  /** Fields to select (if not specified, all fields are returned) */
  select?: string[];
}

/**
 * Aggregation function types
 */
export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';

/**
 * Aggregation field specification
 */
export interface AggregateField {
  field: string;
  function: AggregateFunction;
  alias: string;
}

/**
 * Options for aggregate operations
 */
export interface AggregateOptions {
  /** Fields to aggregate */
  aggregates: AggregateField[];
  /** Filter conditions */
  where?: Where;
  /** Fields to group by */
  groupBy?: string[];
  /** Having conditions (post-aggregation filter) */
  having?: Where;
  /** Sort order */
  orderBy?: SortBy | SortBy[];
  /** Maximum number of results */
  limit?: number;
}

/**
 * Result of a batch operation
 */
export interface BatchResult {
  count: number;
}

/**
 * Base entity type with required fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Core DatabaseAdapter interface
 *
 * This is the main interface that all database adapters must implement.
 * It provides a unified API for database operations across different backends.
 */
export interface DatabaseAdapter {
  /** Unique identifier for this adapter type (e.g., 'kysely', 'convex', 'mongodb') */
  readonly id: string;

  /** Capabilities supported by this adapter */
  readonly capabilities: AdapterCapabilities;

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Create a single record
   * @param table The table name
   * @param data The data to insert (without id, createdAt, updatedAt)
   * @returns The created record with generated id and timestamps
   */
  create<T extends BaseEntity>(
    table: TableName,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T>;

  /**
   * Create multiple records in a batch
   * @param table The table name
   * @param data Array of data to insert
   * @returns Count of created records
   */
  createMany<T extends BaseEntity>(
    table: TableName,
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult>;

  /**
   * Find a single record matching the query
   * @param table The table name
   * @param options Query options (where, select)
   * @returns The found record or null
   */
  findOne<T extends BaseEntity>(
    table: TableName,
    options: QueryOptions
  ): Promise<T | null>;

  /**
   * Find multiple records matching the query
   * @param table The table name
   * @param options Query options (where, limit, offset, orderBy, select)
   * @returns Array of matching records
   */
  findMany<T extends BaseEntity>(
    table: TableName,
    options?: QueryOptions
  ): Promise<T[]>;

  /**
   * Update a single record matching the where conditions
   * @param table The table name
   * @param where Filter conditions to find the record
   * @param data Fields to update
   * @returns The updated record or null if not found
   */
  update<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T | null>;

  /**
   * Update multiple records matching the where conditions
   * @param table The table name
   * @param where Filter conditions
   * @param data Fields to update
   * @returns Count of updated records
   */
  updateMany<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult>;

  /**
   * Delete a single record matching the where conditions
   * @param table The table name
   * @param where Filter conditions
   */
  delete(table: TableName, where: Where): Promise<void>;

  /**
   * Delete multiple records matching the where conditions
   * @param table The table name
   * @param where Filter conditions
   * @returns Count of deleted records
   */
  deleteMany(table: TableName, where: Where): Promise<BatchResult>;

  /**
   * Count records matching the where conditions
   * @param table The table name
   * @param where Optional filter conditions
   * @returns Number of matching records
   */
  count(table: TableName, where?: Where): Promise<number>;

  // ============================================================================
  // Advanced Operations (Optional - based on capabilities)
  // ============================================================================

  /**
   * Perform aggregation operations (SUM, AVG, COUNT, etc.)
   * Optional - only available if capabilities.supportsAggregations is true
   * @param table The table name
   * @param options Aggregation options
   * @returns Array of aggregation results
   */
  aggregate?<T>(table: TableName, options: AggregateOptions): Promise<T[]>;

  /**
   * Execute operations within a transaction
   * Optional - only available if capabilities.supportsTransactions is true
   * @param callback Function to execute within the transaction
   * @returns The result of the callback
   */
  transaction?<T>(
    callback: (adapter: DatabaseAdapter) => Promise<T>
  ): Promise<T>;

  /**
   * Execute a raw query (adapter-specific)
   * Optional - for escape hatch scenarios
   * @param query The raw query (format depends on adapter)
   * @returns Query results
   */
  raw?<T>(query: unknown): Promise<T>;

  /**
   * Get the underlying database client/connection
   * Optional - for advanced use cases
   * @returns The underlying client (type depends on adapter)
   */
  getClient?(): unknown;
}

/**
 * Adapter migration result
 * Note: Named differently to avoid conflict with db/migrations MigrationResult
 */
export interface AdapterMigrationResult {
  success: boolean;
  migrationsRun: string[];
  error?: string;
}

/**
 * Migration adapter interface for schema management
 *
 * This interface handles database schema migrations and is separate from
 * the main DatabaseAdapter to allow for different migration strategies.
 */
export interface MigrationAdapter {
  /** Run pending migrations */
  migrate(): Promise<AdapterMigrationResult>;

  /** Check if there are pending migrations */
  needsMigration(): Promise<boolean>;

  /**
   * Generate schema definition for the database
   * Optional - for databases that don't use SQL migrations (e.g., Convex)
   * @returns Schema definition string
   */
  generateSchema?(): Promise<string>;

  /**
   * Rollback the last migration
   * Optional - not all databases support rollback
   */
  rollback?(): Promise<AdapterMigrationResult>;
}

/**
 * Type guard to check if a value is a DatabaseAdapter
 */
export function isDatabaseAdapter(value: unknown): value is DatabaseAdapter {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const adapter = value as DatabaseAdapter;
  return (
    typeof adapter.id === 'string' &&
    typeof adapter.capabilities === 'object' &&
    typeof adapter.create === 'function' &&
    typeof adapter.findOne === 'function' &&
    typeof adapter.findMany === 'function' &&
    typeof adapter.update === 'function' &&
    typeof adapter.delete === 'function' &&
    typeof adapter.count === 'function'
  );
}

/**
 * Helper to build where conditions
 */
export const where = {
  eq: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'eq',
    value,
  }),
  ne: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'ne',
    value,
  }),
  gt: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'gt',
    value,
  }),
  gte: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'gte',
    value,
  }),
  lt: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'lt',
    value,
  }),
  lte: (field: string, value: unknown): WhereCondition => ({
    field,
    operator: 'lte',
    value,
  }),
  in: (field: string, values: unknown[]): WhereCondition => ({
    field,
    operator: 'in',
    value: values,
  }),
  nin: (field: string, values: unknown[]): WhereCondition => ({
    field,
    operator: 'nin',
    value: values,
  }),
  contains: (field: string, value: string): WhereCondition => ({
    field,
    operator: 'contains',
    value,
  }),
  startsWith: (field: string, value: string): WhereCondition => ({
    field,
    operator: 'starts_with',
    value,
  }),
  endsWith: (field: string, value: string): WhereCondition => ({
    field,
    operator: 'ends_with',
    value,
  }),
  isNull: (field: string): WhereCondition => ({
    field,
    operator: 'is_null',
    value: null,
  }),
  isNotNull: (field: string): WhereCondition => ({
    field,
    operator: 'is_not_null',
    value: null,
  }),
};
