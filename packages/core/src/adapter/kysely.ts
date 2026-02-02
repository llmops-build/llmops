/**
 * Kysely Database Adapter
 *
 * Implements the Adapter interface using Kysely query builder.
 * This wraps the existing Kysely database instance to provide
 * a database-agnostic interface.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../db/schema';
import type { Adapter, Where, FindManyOptions } from './types';

/**
 * Build where clauses from the generic Where[] format
 */
function buildWhere<T>(
  qb: T,
  where: Where[],
  methods: { where: string; orWhere: string }
): T {
  let result = qb;

  for (const condition of where) {
    const { field, operator = 'eq', value, connector = 'AND' } = condition;
    const method = connector === 'OR' ? methods.orWhere : methods.where;

    switch (operator) {
      case 'eq':
        result = (result as any)[method](field, '=', value);
        break;
      case 'ne':
        result = (result as any)[method](field, '!=', value);
        break;
      case 'lt':
        result = (result as any)[method](field, '<', value);
        break;
      case 'lte':
        result = (result as any)[method](field, '<=', value);
        break;
      case 'gt':
        result = (result as any)[method](field, '>', value);
        break;
      case 'gte':
        result = (result as any)[method](field, '>=', value);
        break;
      case 'in':
        result = (result as any)[method](field, 'in', value);
        break;
      case 'contains':
        result = (result as any)[method](field, 'like', `%${value}%`);
        break;
      case 'starts_with':
        result = (result as any)[method](field, 'like', `${value}%`);
        break;
      case 'ends_with':
        result = (result as any)[method](field, 'like', `%${value}`);
        break;
      default:
        result = (result as any)[method](field, '=', value);
    }
  }

  return result;
}

/**
 * Create a Kysely-based adapter implementation
 *
 * @param db - Kysely database instance
 * @returns Adapter implementation
 *
 * @example
 * ```ts
 * const db = new Kysely<Database>({ dialect });
 * const adapter = createKyselyAdapter(db);
 * const config = await adapter.create('configs', { name: 'test' });
 * ```
 */
export function createKyselyAdapter(db: Kysely<Database>): Adapter {
  return {
    async create<T>(model: string, data: Record<string, unknown>): Promise<T> {
      const result = await db
        .insertInto(model as keyof Database)
        .values(data as any)
        .returningAll()
        .executeTakeFirstOrThrow();

      return result as T;
    },

    async findOne<T>(model: string, where: Where[]): Promise<T | null> {
      let qb = db.selectFrom(model as keyof Database).selectAll();

      qb = buildWhere(qb, where, { where: 'where', orWhere: 'orWhere' });

      const result = await qb.executeTakeFirst();
      return (result as T) ?? null;
    },

    async findMany<T>(
      model: string,
      options: FindManyOptions = {}
    ): Promise<T[]> {
      let qb = db.selectFrom(model as keyof Database).selectAll();

      if (options.where && options.where.length > 0) {
        qb = buildWhere(qb, options.where, {
          where: 'where',
          orWhere: 'orWhere',
        });
      }

      if (options.orderBy && options.orderBy.length > 0) {
        for (const order of options.orderBy) {
          qb = qb.orderBy(order.field as any, order.direction);
        }
      }

      if (options.limit !== undefined) {
        qb = qb.limit(options.limit);
      }

      if (options.offset !== undefined) {
        qb = qb.offset(options.offset);
      }

      const results = await qb.execute();
      return results as T[];
    },

    async update<T>(
      model: string,
      where: Where[],
      data: Record<string, unknown>
    ): Promise<T | null> {
      let qb = db.updateTable(model as keyof Database).set(data as any);

      qb = buildWhere(qb, where, { where: 'where', orWhere: 'orWhere' });

      const result = await qb.returningAll().executeTakeFirst();
      return (result as T) ?? null;
    },

    async delete<T>(model: string, where: Where[]): Promise<T | null> {
      let qb = db.deleteFrom(model as keyof Database);

      qb = buildWhere(qb, where, { where: 'where', orWhere: 'orWhere' });

      const result = await qb.returningAll().executeTakeFirst();
      return (result as T) ?? null;
    },

    async createMany<T>(
      model: string,
      data: Record<string, unknown>[]
    ): Promise<T[]> {
      if (data.length === 0) {
        return [];
      }

      const results = await db
        .insertInto(model as keyof Database)
        .values(data as any)
        .returningAll()
        .execute();

      return results as T[];
    },

    async deleteMany(model: string, where: Where[]): Promise<number> {
      let qb = db.deleteFrom(model as keyof Database);

      if (where.length > 0) {
        qb = buildWhere(qb, where, { where: 'where', orWhere: 'orWhere' });
      }

      const result = await qb.executeTakeFirst();
      return Number(result.numDeletedRows ?? 0);
    },

    async count(model: string, where: Where[] = []): Promise<number> {
      let qb = db
        .selectFrom(model as keyof Database)
        .select((eb) => eb.fn.countAll().as('count'));

      if (where.length > 0) {
        qb = buildWhere(qb, where, { where: 'where', orWhere: 'orWhere' });
      }

      const result = await qb.executeTakeFirst();
      return Number(result?.count ?? 0);
    },

    async transaction<T>(fn: (adapter: Adapter) => Promise<T>): Promise<T> {
      return db.transaction().execute(async (trx) => {
        const txAdapter = createKyselyAdapter(trx as unknown as Kysely<Database>);
        return fn(txAdapter);
      });
    },
  };
}
