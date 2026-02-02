/**
 * Generic Database Adapter Interface
 *
 * This interface defines a database-agnostic CRUD API that can be implemented
 * by different database backends (Kysely, Convex, MongoDB, etc.)
 *
 * Inspired by better-auth's adapter pattern.
 */

/**
 * Supported comparison operators for where clauses
 */
export type WhereOperator =
  | 'eq'
  | 'ne'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'in'
  | 'contains'
  | 'starts_with'
  | 'ends_with';

/**
 * A single where condition
 */
export type Where = {
  /** The field name to filter on */
  field: string;
  /** The comparison operator (defaults to 'eq') */
  operator?: WhereOperator;
  /** The value to compare against */
  value: string | number | boolean | string[] | number[] | Date | null;
  /** How to connect with previous conditions (defaults to 'AND') */
  connector?: 'AND' | 'OR';
};

/**
 * Order by specification
 */
export type OrderBy = {
  /** The field name to order by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
};

/**
 * Options for findMany queries
 */
export type FindManyOptions = {
  /** Filter conditions */
  where?: Where[];
  /** Order by specifications */
  orderBy?: OrderBy[];
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
};

/**
 * Generic Database Adapter Interface
 *
 * All database adapters must implement these methods to be compatible
 * with the LLMOps DataLayer.
 */
export interface Adapter {
  /**
   * Create a new record in the specified model/table
   * @param model - The table/collection name
   * @param data - The data to insert
   * @returns The created record
   */
  create<T>(model: string, data: Record<string, unknown>): Promise<T>;

  /**
   * Find a single record matching the where conditions
   * @param model - The table/collection name
   * @param where - Filter conditions
   * @returns The matching record or null
   */
  findOne<T>(model: string, where: Where[]): Promise<T | null>;

  /**
   * Find multiple records matching the criteria
   * @param model - The table/collection name
   * @param options - Query options (where, orderBy, limit, offset)
   * @returns Array of matching records
   */
  findMany<T>(model: string, options?: FindManyOptions): Promise<T[]>;

  /**
   * Update records matching the where conditions
   * @param model - The table/collection name
   * @param where - Filter conditions to identify record(s)
   * @param data - The data to update
   * @returns The updated record or null if not found
   */
  update<T>(
    model: string,
    where: Where[],
    data: Record<string, unknown>
  ): Promise<T | null>;

  /**
   * Delete a record matching the where conditions
   * @param model - The table/collection name
   * @param where - Filter conditions
   * @returns The deleted record or null if not found
   */
  delete<T>(model: string, where: Where[]): Promise<T | null>;

  /**
   * Create multiple records in a single operation
   * @param model - The table/collection name
   * @param data - Array of records to insert
   * @returns Array of created records
   */
  createMany<T>(model: string, data: Record<string, unknown>[]): Promise<T[]>;

  /**
   * Delete multiple records matching the where conditions
   * @param model - The table/collection name
   * @param where - Filter conditions
   * @returns Number of deleted records
   */
  deleteMany(model: string, where: Where[]): Promise<number>;

  /**
   * Count records matching the where conditions
   * @param model - The table/collection name
   * @param where - Optional filter conditions
   * @returns Number of matching records
   */
  count(model: string, where?: Where[]): Promise<number>;

  /**
   * Execute multiple operations in a transaction
   * @param fn - Function containing operations to execute
   * @returns Result of the transaction function
   */
  transaction?<T>(fn: (adapter: Adapter) => Promise<T>): Promise<T>;
}

/**
 * Table name type for type-safe model references
 */
export type TableName =
  | 'configs'
  | 'variants'
  | 'variant_versions'
  | 'environments'
  | 'environment_secrets'
  | 'config_variants'
  | 'targeting_rules'
  | 'workspace_settings'
  | 'provider_configs'
  | 'playgrounds'
  | 'playground_runs'
  | 'playground_results'
  | 'guardrail_configs'
  | 'provider_guardrail_overrides'
  | 'datasets'
  | 'dataset_versions'
  | 'dataset_records'
  | 'dataset_version_records'
  | 'llm_requests';
