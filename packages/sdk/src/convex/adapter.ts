/**
 * Convex Database Adapter
 *
 * This adapter implements the DatabaseAdapter interface for Convex databases.
 * It translates the generic adapter operations into Convex-specific queries and mutations.
 *
 * Note: Convex has different characteristics than SQL databases:
 * - No native JOINs (handled client-side)
 * - No native aggregations (handled client-side)
 * - Different query syntax
 * - Document-based storage
 */

import type {
  DatabaseAdapter,
  AdapterCapabilities,
  Where,
  WhereCondition,
  QueryOptions,
  AggregateOptions,
  BatchResult,
  BaseEntity,
  MigrationAdapter,
  AdapterMigrationResult,
} from '@llmops/core';
import { NOSQL_ADAPTER_CAPABILITIES } from '@llmops/core';
import type { TableName } from '@llmops/core';

/**
 * Convex client interface - generic to support different Convex client types
 */
export interface ConvexClientInterface {
  query<T>(fn: any, args?: Record<string, unknown>): Promise<T>;
  mutation<T>(fn: any, args?: Record<string, unknown>): Promise<T>;
}

/**
 * Configuration options for the Convex adapter
 */
export interface ConvexAdapterOptions {
  /** The Convex client instance */
  client: ConvexClientInterface;
  /**
   * Convex function references for database operations
   * These should point to generic CRUD functions in your Convex project
   */
  functions?: {
    create?: any;
    createMany?: any;
    findOne?: any;
    findMany?: any;
    update?: any;
    updateMany?: any;
    deleteOne?: any;
    deleteMany?: any;
    count?: any;
  };
  /**
   * Table name mapping if your Convex tables have different names
   */
  tableMapping?: Partial<Record<TableName, string>>;
}

/**
 * Default Convex adapter capabilities
 */
const CONVEX_CAPABILITIES: AdapterCapabilities = {
  ...NOSQL_ADAPTER_CAPABILITIES,
  supportsJSON: true,
  supportsTransactions: false, // Convex has different transaction semantics
  supportsReturning: true,
  supportsJoins: false,
  supportsAggregations: false,
  supportsBatchInsert: true,
};

/**
 * Convex Database Adapter
 *
 * Implements the DatabaseAdapter interface for Convex databases.
 * Uses client-side aggregation for complex queries.
 */
export class ConvexAdapter implements DatabaseAdapter {
  readonly id = 'convex';
  readonly capabilities: AdapterCapabilities = CONVEX_CAPABILITIES;

  private readonly client: ConvexClientInterface;
  private readonly functions: ConvexAdapterOptions['functions'];
  private readonly tableMapping: Partial<Record<TableName, string>>;

  constructor(options: ConvexAdapterOptions) {
    this.client = options.client;
    this.functions = options.functions;
    this.tableMapping = options.tableMapping ?? {};
  }

  /**
   * Get the Convex table name (applies mapping if configured)
   */
  private getTableName(table: TableName): string {
    return this.tableMapping[table] ?? table;
  }

  /**
   * Convert adapter where conditions to Convex filter format
   */
  private convertWhereToConvexFilter(
    where: Where
  ): Record<string, unknown>[] {
    return where.map((condition) => ({
      field: condition.field,
      operator: this.convertOperator(condition.operator),
      value: condition.value,
    }));
  }

  /**
   * Convert adapter operators to Convex operators
   */
  private convertOperator(
    op: WhereCondition['operator']
  ): string {
    const operatorMap: Record<WhereCondition['operator'], string> = {
      eq: 'eq',
      ne: 'neq',
      gt: 'gt',
      gte: 'gte',
      lt: 'lt',
      lte: 'lte',
      in: 'in',
      nin: 'notIn',
      contains: 'contains',
      starts_with: 'startsWith',
      ends_with: 'endsWith',
      is_null: 'isNull',
      is_not_null: 'isNotNull',
    };
    return operatorMap[op] ?? 'eq';
  }

  async create<T extends BaseEntity>(
    table: TableName,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    const tableName = this.getTableName(table);
    const now = new Date().toISOString();

    const insertData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    if (this.functions?.create) {
      const result = await this.client.mutation<T>(this.functions.create, {
        table: tableName,
        data: insertData,
      });
      return result;
    }

    // Fallback: Use generic mutation pattern
    // This assumes you have a generic insert mutation in your Convex project
    throw new Error(
      'Convex adapter requires functions.create to be configured'
    );
  }

  async createMany<T extends BaseEntity>(
    table: TableName,
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult> {
    const tableName = this.getTableName(table);
    const now = new Date().toISOString();

    const insertData = data.map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
    }));

    if (this.functions?.createMany) {
      const result = await this.client.mutation<BatchResult>(
        this.functions.createMany,
        {
          table: tableName,
          data: insertData,
        }
      );
      return result;
    }

    // Fallback: Insert one by one
    for (const item of insertData) {
      await this.create<T>(table, item as any);
    }
    return { count: data.length };
  }

  async findOne<T extends BaseEntity>(
    table: TableName,
    options: QueryOptions
  ): Promise<T | null> {
    const tableName = this.getTableName(table);

    if (this.functions?.findOne) {
      const result = await this.client.query<T | null>(this.functions.findOne, {
        table: tableName,
        filter: options.where
          ? this.convertWhereToConvexFilter(options.where)
          : [],
        select: options.select,
      });
      return result;
    }

    // Fallback: Use findMany with limit 1
    const results = await this.findMany<T>(table, { ...options, limit: 1 });
    return results[0] ?? null;
  }

  async findMany<T extends BaseEntity>(
    table: TableName,
    options?: QueryOptions
  ): Promise<T[]> {
    const tableName = this.getTableName(table);

    if (this.functions?.findMany) {
      const result = await this.client.query<T[]>(this.functions.findMany, {
        table: tableName,
        filter: options?.where
          ? this.convertWhereToConvexFilter(options.where)
          : [],
        limit: options?.limit,
        offset: options?.offset,
        orderBy: options?.orderBy,
        select: options?.select,
      });
      return result;
    }

    throw new Error(
      'Convex adapter requires functions.findMany to be configured'
    );
  }

  async update<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T | null> {
    const tableName = this.getTableName(table);
    const now = new Date().toISOString();

    const updateData = {
      ...data,
      updatedAt: now,
    };

    if (this.functions?.update) {
      const result = await this.client.mutation<T | null>(this.functions.update, {
        table: tableName,
        filter: this.convertWhereToConvexFilter(where),
        data: updateData,
      });
      return result;
    }

    throw new Error(
      'Convex adapter requires functions.update to be configured'
    );
  }

  async updateMany<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult> {
    const tableName = this.getTableName(table);
    const now = new Date().toISOString();

    const updateData = {
      ...data,
      updatedAt: now,
    };

    if (this.functions?.updateMany) {
      const result = await this.client.mutation<BatchResult>(
        this.functions.updateMany,
        {
          table: tableName,
          filter: this.convertWhereToConvexFilter(where),
          data: updateData,
        }
      );
      return result;
    }

    // Fallback: Find and update one by one
    const items = await this.findMany<T>(table, { where });
    for (const item of items) {
      await this.update<T>(table, [{ field: 'id', operator: 'eq', value: item.id }], data);
    }
    return { count: items.length };
  }

  async delete(table: TableName, where: Where): Promise<void> {
    const tableName = this.getTableName(table);

    if (this.functions?.deleteOne) {
      await this.client.mutation(this.functions.deleteOne, {
        table: tableName,
        filter: this.convertWhereToConvexFilter(where),
      });
      return;
    }

    throw new Error(
      'Convex adapter requires functions.deleteOne to be configured'
    );
  }

  async deleteMany(table: TableName, where: Where): Promise<BatchResult> {
    const tableName = this.getTableName(table);

    if (this.functions?.deleteMany) {
      const result = await this.client.mutation<BatchResult>(
        this.functions.deleteMany,
        {
          table: tableName,
          filter: this.convertWhereToConvexFilter(where),
        }
      );
      return result;
    }

    // Fallback: Find and delete one by one
    const items = await this.findMany<BaseEntity>(table, { where });
    for (const item of items) {
      await this.delete(table, [{ field: 'id', operator: 'eq', value: item.id }]);
    }
    return { count: items.length };
  }

  async count(table: TableName, where?: Where): Promise<number> {
    const tableName = this.getTableName(table);

    if (this.functions?.count) {
      const result = await this.client.query<number>(this.functions.count, {
        table: tableName,
        filter: where ? this.convertWhereToConvexFilter(where) : [],
      });
      return result;
    }

    // Fallback: Fetch all and count client-side
    const items = await this.findMany<BaseEntity>(table, { where });
    return items.length;
  }

  /**
   * Aggregations are not natively supported by Convex
   * Use client-side aggregation helpers instead
   */
  async aggregate<T>(
    _table: TableName,
    _options: AggregateOptions
  ): Promise<T[]> {
    throw new Error(
      'Convex does not support native aggregations. Use clientAggregate() from @llmops/core instead.'
    );
  }

  /**
   * Convex has different transaction semantics
   * Mutations in Convex are already atomic
   */
  async transaction<T>(
    _callback: (adapter: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    throw new Error(
      'Convex does not support the transaction pattern. Convex mutations are already atomic.'
    );
  }

  /**
   * Get the underlying Convex client
   */
  getClient(): ConvexClientInterface {
    return this.client;
  }
}

/**
 * Create a Convex database adapter
 *
 * @example
 * ```ts
 * import { ConvexClient } from 'convex/browser';
 * import { createConvexAdapter } from '@llmops/sdk/convex';
 * import { api } from '../convex/_generated/api';
 *
 * const convex = new ConvexClient(process.env.CONVEX_URL);
 *
 * const adapter = createConvexAdapter({
 *   client: convex,
 *   functions: {
 *     create: api.llmops.create,
 *     createMany: api.llmops.createMany,
 *     findOne: api.llmops.findOne,
 *     findMany: api.llmops.findMany,
 *     update: api.llmops.update,
 *     deleteOne: api.llmops.deleteOne,
 *     count: api.llmops.count,
 *   },
 * });
 * ```
 */
export function createConvexAdapter(
  options: ConvexAdapterOptions
): ConvexAdapter {
  return new ConvexAdapter(options);
}

/**
 * Convex Migration Adapter
 *
 * For Convex, migrations work differently - you define the schema
 * in a schema.ts file and Convex handles the schema automatically.
 * This adapter primarily provides schema generation.
 */
export class ConvexMigrationAdapter implements MigrationAdapter {
  constructor(private readonly options: { generateSchemaFn?: () => string }) {}

  async migrate(): Promise<AdapterMigrationResult> {
    // Convex handles schema management automatically
    // No manual migration needed
    return {
      success: true,
      migrationsRun: [],
    };
  }

  async needsMigration(): Promise<boolean> {
    // Convex handles schema automatically
    return false;
  }

  async generateSchema(): Promise<string> {
    if (this.options.generateSchemaFn) {
      return this.options.generateSchemaFn();
    }

    // Import and use the schema generator
    const { generateConvexSchema } = await import('./schema-generator');
    return generateConvexSchema();
  }
}

/**
 * Create a Convex migration adapter
 */
export function createConvexMigrationAdapter(options?: {
  generateSchemaFn?: () => string;
}): ConvexMigrationAdapter {
  return new ConvexMigrationAdapter(options ?? {});
}
