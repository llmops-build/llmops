/**
 * Kysely Database Adapter
 *
 * This adapter wraps Kysely database instances to provide a unified DatabaseAdapter interface.
 * It's the default adapter used when a raw pg Pool or other SQL connection is passed.
 */

import type { Kysely, ExpressionBuilder, SelectQueryBuilder } from 'kysely';
import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import type { Database, TableName } from '../db/schema';
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
} from './types';
import { SQL_ADAPTER_CAPABILITIES } from './types';

/**
 * Apply a where condition to a Kysely expression builder
 */
function applyWhereCondition<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  condition: WhereCondition
): ReturnType<typeof eb.and> {
  const { field, operator, value } = condition;
  const column = field as keyof DB[TB] & string;

  switch (operator) {
    case 'eq':
      return eb(column, '=', value as any);
    case 'ne':
      return eb(column, '!=', value as any);
    case 'gt':
      return eb(column, '>', value as any);
    case 'gte':
      return eb(column, '>=', value as any);
    case 'lt':
      return eb(column, '<', value as any);
    case 'lte':
      return eb(column, '<=', value as any);
    case 'in':
      return eb(column, 'in', value as any[]);
    case 'nin':
      return eb(column, 'not in', value as any[]);
    case 'contains':
      return eb(column, 'like', `%${value}%` as any);
    case 'starts_with':
      return eb(column, 'like', `${value}%` as any);
    case 'ends_with':
      return eb(column, 'like', `%${value}` as any);
    case 'is_null':
      return eb(column, 'is', null);
    case 'is_not_null':
      return eb(column, 'is not', null);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

/**
 * Apply where conditions to a query builder
 */
function applyWhere<T>(
  query: SelectQueryBuilder<Database, TableName, T>,
  where: Where
): SelectQueryBuilder<Database, TableName, T> {
  if (!where || where.length === 0) {
    return query;
  }

  return query.where((eb) => {
    const conditions = where.map((condition) =>
      applyWhereCondition(eb, condition)
    );
    return eb.and(conditions);
  }) as SelectQueryBuilder<Database, TableName, T>;
}

/**
 * Kysely Database Adapter
 *
 * Provides the DatabaseAdapter interface for Kysely-based database connections.
 */
export class KyselyAdapter implements DatabaseAdapter {
  readonly id = 'kysely';
  readonly capabilities: AdapterCapabilities = SQL_ADAPTER_CAPABILITIES;

  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Get the underlying Kysely instance
   */
  getKysely(): Kysely<Database> {
    return this.db;
  }

  async create<T extends BaseEntity>(
    table: TableName,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    const now = new Date().toISOString();
    const insertData = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // Handle JSON fields by serializing them
    const serializedData = this.serializeForInsert(table, insertData);

    const result = await this.db
      .insertInto(table)
      .values(serializedData as any)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.deserializeResult(table, result) as T;
  }

  async createMany<T extends BaseEntity>(
    table: TableName,
    data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult> {
    if (data.length === 0) {
      return { count: 0 };
    }

    const now = new Date().toISOString();
    const insertData = data.map((item) => {
      const record = {
        ...item,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      return this.serializeForInsert(table, record);
    });

    const result = await this.db
      .insertInto(table)
      .values(insertData as any[])
      .execute();

    return { count: Number(result.length > 0 ? result[0].numInsertedOrUpdatedRows : data.length) };
  }

  async findOne<T extends BaseEntity>(
    table: TableName,
    options: QueryOptions
  ): Promise<T | null> {
    let query = this.db.selectFrom(table).selectAll();

    if (options.where && options.where.length > 0) {
      query = applyWhere(query, options.where) as typeof query;
    }

    if (options.select && options.select.length > 0) {
      query = this.db
        .selectFrom(table)
        .select(options.select as any[]) as typeof query;

      if (options.where && options.where.length > 0) {
        query = applyWhere(query, options.where) as typeof query;
      }
    }

    const result = await query.executeTakeFirst();
    return result ? (this.deserializeResult(table, result) as T) : null;
  }

  async findMany<T extends BaseEntity>(
    table: TableName,
    options?: QueryOptions
  ): Promise<T[]> {
    let query = this.db.selectFrom(table).selectAll();

    if (options?.where && options.where.length > 0) {
      query = applyWhere(query, options.where) as typeof query;
    }

    if (options?.select && options.select.length > 0) {
      query = this.db
        .selectFrom(table)
        .select(options.select as any[]) as typeof query;

      if (options?.where && options.where.length > 0) {
        query = applyWhere(query, options.where) as typeof query;
      }
    }

    if (options?.orderBy) {
      const orderByArray = Array.isArray(options.orderBy)
        ? options.orderBy
        : [options.orderBy];

      for (const order of orderByArray) {
        query = query.orderBy(order.field as any, order.direction) as typeof query;
      }
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit) as typeof query;
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset) as typeof query;
    }

    const results = await query.execute();
    return results.map((result) => this.deserializeResult(table, result) as T);
  }

  async update<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T | null> {
    if (!where || where.length === 0) {
      throw new Error('Update requires at least one where condition');
    }

    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const serializedData = this.serializeForUpdate(table, updateData);

    let query = this.db.updateTable(table).set(serializedData as any);

    // Apply where conditions
    for (const condition of where) {
      const { field, operator, value } = condition;
      switch (operator) {
        case 'eq':
          query = query.where(field as any, '=', value as any);
          break;
        case 'ne':
          query = query.where(field as any, '!=', value as any);
          break;
        case 'in':
          query = query.where(field as any, 'in', value as any[]);
          break;
        case 'is_null':
          query = query.where(field as any, 'is', null);
          break;
        case 'is_not_null':
          query = query.where(field as any, 'is not', null);
          break;
        default:
          query = query.where(field as any, '=', value as any);
      }
    }

    const result = await query.returningAll().executeTakeFirst();
    return result ? (this.deserializeResult(table, result) as T) : null;
  }

  async updateMany<T extends BaseEntity>(
    table: TableName,
    where: Where,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<BatchResult> {
    if (!where || where.length === 0) {
      throw new Error('UpdateMany requires at least one where condition');
    }

    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const serializedData = this.serializeForUpdate(table, updateData);

    let query = this.db.updateTable(table).set(serializedData as any);

    // Apply where conditions
    for (const condition of where) {
      const { field, operator, value } = condition;
      switch (operator) {
        case 'eq':
          query = query.where(field as any, '=', value as any);
          break;
        case 'ne':
          query = query.where(field as any, '!=', value as any);
          break;
        case 'in':
          query = query.where(field as any, 'in', value as any[]);
          break;
        default:
          query = query.where(field as any, '=', value as any);
      }
    }

    const result = await query.execute();
    return { count: Number(result[0]?.numUpdatedRows ?? 0) };
  }

  async delete(table: TableName, where: Where): Promise<void> {
    if (!where || where.length === 0) {
      throw new Error('Delete requires at least one where condition');
    }

    let query = this.db.deleteFrom(table);

    // Apply where conditions
    for (const condition of where) {
      const { field, operator, value } = condition;
      switch (operator) {
        case 'eq':
          query = query.where(field as any, '=', value as any);
          break;
        case 'ne':
          query = query.where(field as any, '!=', value as any);
          break;
        case 'in':
          query = query.where(field as any, 'in', value as any[]);
          break;
        default:
          query = query.where(field as any, '=', value as any);
      }
    }

    await query.execute();
  }

  async deleteMany(table: TableName, where: Where): Promise<BatchResult> {
    if (!where || where.length === 0) {
      throw new Error('DeleteMany requires at least one where condition');
    }

    let query = this.db.deleteFrom(table);

    // Apply where conditions
    for (const condition of where) {
      const { field, operator, value } = condition;
      switch (operator) {
        case 'eq':
          query = query.where(field as any, '=', value as any);
          break;
        case 'ne':
          query = query.where(field as any, '!=', value as any);
          break;
        case 'in':
          query = query.where(field as any, 'in', value as any[]);
          break;
        default:
          query = query.where(field as any, '=', value as any);
      }
    }

    const result = await query.execute();
    return { count: Number(result[0]?.numDeletedRows ?? 0) };
  }

  async count(table: TableName, where?: Where): Promise<number> {
    let query = this.db
      .selectFrom(table)
      .select((eb) => eb.fn.countAll().as('count'));

    if (where && where.length > 0) {
      query = applyWhere(query, where) as typeof query;
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async aggregate<T>(table: TableName, options: AggregateOptions): Promise<T[]> {
    // Build dynamic aggregation query
    const selectExpressions: any[] = [];

    for (const agg of options.aggregates) {
      switch (agg.function) {
        case 'count':
          selectExpressions.push(
            sql`COUNT(${sql.ref(agg.field)})`.as(agg.alias)
          );
          break;
        case 'sum':
          selectExpressions.push(
            sql`SUM(${sql.ref(agg.field)})`.as(agg.alias)
          );
          break;
        case 'avg':
          selectExpressions.push(
            sql`AVG(${sql.ref(agg.field)})`.as(agg.alias)
          );
          break;
        case 'min':
          selectExpressions.push(
            sql`MIN(${sql.ref(agg.field)})`.as(agg.alias)
          );
          break;
        case 'max':
          selectExpressions.push(
            sql`MAX(${sql.ref(agg.field)})`.as(agg.alias)
          );
          break;
      }
    }

    // Add group by columns to select
    if (options.groupBy) {
      for (const col of options.groupBy) {
        selectExpressions.push(sql.ref(col).as(col));
      }
    }

    let query = this.db.selectFrom(table).select(selectExpressions);

    // Apply where conditions
    if (options.where && options.where.length > 0) {
      query = applyWhere(query, options.where) as typeof query;
    }

    // Apply group by
    if (options.groupBy && options.groupBy.length > 0) {
      query = query.groupBy(options.groupBy as any[]) as typeof query;
    }

    // Apply order by
    if (options.orderBy) {
      const orderByArray = Array.isArray(options.orderBy)
        ? options.orderBy
        : [options.orderBy];

      for (const order of orderByArray) {
        query = query.orderBy(order.field as any, order.direction) as typeof query;
      }
    }

    // Apply limit
    if (options.limit !== undefined) {
      query = query.limit(options.limit) as typeof query;
    }

    const results = await query.execute();
    return results as T[];
  }

  async transaction<T>(
    callback: (adapter: DatabaseAdapter) => Promise<T>
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      const txAdapter = new KyselyAdapter(trx as unknown as Kysely<Database>);
      return callback(txAdapter);
    });
  }

  async raw<T>(query: unknown): Promise<T> {
    if (typeof query === 'string') {
      const result = await sql.raw(query).execute(this.db);
      return result.rows as T;
    }
    throw new Error('Raw query must be a string');
  }

  getClient(): Kysely<Database> {
    return this.db;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Tables with JSON fields that need serialization
   */
  private readonly jsonFields: Record<string, string[]> = {
    variant_versions: ['jsonData'],
    targeting_rules: ['conditions'],
    provider_configs: ['config'],
    llm_requests: ['tags'],
  };

  /**
   * Serialize JSON fields for insert
   */
  private serializeForInsert(table: TableName, data: any): any {
    const fields = this.jsonFields[table];
    if (!fields) return data;

    const result = { ...data };
    for (const field of fields) {
      if (result[field] !== undefined && typeof result[field] === 'object') {
        result[field] = JSON.stringify(result[field]);
      }
    }
    return result;
  }

  /**
   * Serialize JSON fields for update
   */
  private serializeForUpdate(table: TableName, data: any): any {
    return this.serializeForInsert(table, data);
  }

  /**
   * Deserialize JSON fields from result
   */
  private deserializeResult(table: TableName, data: any): any {
    const fields = this.jsonFields[table];
    if (!fields) return data;

    const result = { ...data };
    for (const field of fields) {
      if (result[field] !== undefined && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch {
          // Keep as string if not valid JSON
        }
      }
    }
    return result;
  }
}

/**
 * Create a Kysely adapter from a Kysely instance
 */
export function createKyselyAdapter(db: Kysely<Database>): KyselyAdapter {
  return new KyselyAdapter(db);
}

/**
 * Kysely Migration Adapter
 *
 * Wraps the existing migration system for the MigrationAdapter interface.
 */
export class KyselyMigrationAdapter implements MigrationAdapter {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly schema: string = 'llmops',
    private readonly rawConnection?: unknown
  ) {}

  async migrate(): Promise<AdapterMigrationResult> {
    // Import the migration functions dynamically
    const { getMigrations } = await import('../db/migrations');

    try {
      const result = await getMigrations(this.db, 'postgres', {
        schema: this.schema,
        rawConnection: this.rawConnection,
      });

      if (!result.needsMigration) {
        return {
          success: true,
          migrationsRun: [],
        };
      }

      await result.runMigrations();

      const migrationsRun = [
        ...result.toBeCreated.map((t) => `create:${t.table}`),
        ...result.toBeAdded.map((t) => `alter:${t.table}`),
      ];

      return {
        success: true,
        migrationsRun,
      };
    } catch (error) {
      return {
        success: false,
        migrationsRun: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async needsMigration(): Promise<boolean> {
    const { getMigrations } = await import('../db/migrations');
    const result = await getMigrations(this.db, 'postgres', {
      schema: this.schema,
      rawConnection: this.rawConnection,
    });
    return result.needsMigration;
  }
}

/**
 * Create a Kysely migration adapter
 */
export function createKyselyMigrationAdapter(
  db: Kysely<Database>,
  schema?: string
): KyselyMigrationAdapter {
  return new KyselyMigrationAdapter(db, schema);
}
