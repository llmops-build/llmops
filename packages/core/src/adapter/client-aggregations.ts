/**
 * Client-Side Aggregation Helpers
 *
 * These functions provide aggregation capabilities for databases that don't
 * support native aggregations (like Convex, MongoDB). They fetch data and
 * perform aggregations in JavaScript.
 *
 * Note: These are less efficient than database-native aggregations and should
 * only be used when the database doesn't support aggregations natively.
 */

import type {
  DatabaseAdapter,
  AggregateOptions,
  AggregateField,
  Where,
  SortBy,
  BaseEntity,
} from './types';
import type { TableName } from '../db/schema';

/**
 * Perform aggregation on fetched data
 */
export async function clientAggregate<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  options: AggregateOptions
): Promise<Record<string, unknown>[]> {
  // Fetch all matching records
  const records = await adapter.findMany<T>(table, {
    where: options.where,
  });

  if (!options.groupBy || options.groupBy.length === 0) {
    // No grouping - aggregate all records
    const result: Record<string, unknown> = {};

    for (const agg of options.aggregates) {
      result[agg.alias] = computeAggregate(records, agg);
    }

    return [result];
  }

  // Group records
  const groups = groupRecords(records, options.groupBy);

  // Compute aggregates for each group
  const results: Record<string, unknown>[] = [];

  for (const [groupKey, groupRecords] of groups) {
    const result: Record<string, unknown> = {};

    // Add group key values
    const keyParts = groupKey.split('|');
    for (let i = 0; i < options.groupBy.length; i++) {
      const field = options.groupBy[i];
      result[field] = parseGroupKeyPart(keyParts[i]);
    }

    // Add aggregates
    for (const agg of options.aggregates) {
      result[agg.alias] = computeAggregate(groupRecords, agg);
    }

    results.push(result);
  }

  // Apply having filter (post-aggregation)
  let filteredResults = results;
  if (options.having && options.having.length > 0) {
    filteredResults = applyHavingFilter(results, options.having);
  }

  // Apply ordering
  if (options.orderBy) {
    const orderByArray = Array.isArray(options.orderBy)
      ? options.orderBy
      : [options.orderBy];
    filteredResults = sortResults(filteredResults, orderByArray);
  }

  // Apply limit
  if (options.limit !== undefined) {
    filteredResults = filteredResults.slice(0, options.limit);
  }

  return filteredResults;
}

/**
 * Client-side count
 */
export async function clientCount<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  where?: Where
): Promise<number> {
  const records = await adapter.findMany<T>(table, { where });
  return records.length;
}

/**
 * Client-side sum
 */
export async function clientSum<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  field: string,
  where?: Where
): Promise<number> {
  const records = await adapter.findMany<T>(table, { where });
  return records.reduce((sum, record) => {
    const value = getFieldValue(record, field);
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Client-side average
 */
export async function clientAvg<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  field: string,
  where?: Where
): Promise<number | null> {
  const records = await adapter.findMany<T>(table, { where });

  if (records.length === 0) {
    return null;
  }

  const sum = records.reduce((acc, record) => {
    const value = getFieldValue(record, field);
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);

  return sum / records.length;
}

/**
 * Client-side min
 */
export async function clientMin<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  field: string,
  where?: Where
): Promise<number | null> {
  const records = await adapter.findMany<T>(table, { where });

  if (records.length === 0) {
    return null;
  }

  let min: number | null = null;

  for (const record of records) {
    const value = getFieldValue(record, field);
    if (typeof value === 'number') {
      if (min === null || value < min) {
        min = value;
      }
    }
  }

  return min;
}

/**
 * Client-side max
 */
export async function clientMax<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  field: string,
  where?: Where
): Promise<number | null> {
  const records = await adapter.findMany<T>(table, { where });

  if (records.length === 0) {
    return null;
  }

  let max: number | null = null;

  for (const record of records) {
    const value = getFieldValue(record, field);
    if (typeof value === 'number') {
      if (max === null || value > max) {
        max = value;
      }
    }
  }

  return max;
}

/**
 * Client-side group by
 */
export async function clientGroupBy<T extends BaseEntity>(
  adapter: DatabaseAdapter,
  table: TableName,
  groupByFields: string[],
  aggregates: AggregateField[],
  where?: Where
): Promise<Record<string, unknown>[]> {
  return clientAggregate<T>(adapter, table, {
    aggregates,
    where,
    groupBy: groupByFields,
  });
}

// ============================================================================
// Private Helpers
// ============================================================================

/**
 * Get a nested field value from a record
 */
function getFieldValue(record: unknown, field: string): unknown {
  if (!record || typeof record !== 'object') {
    return undefined;
  }

  const parts = field.split('.');
  let current: unknown = record;

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Compute a single aggregate value
 */
function computeAggregate(
  records: unknown[],
  agg: AggregateField
): number | null {
  const values = records
    .map((r) => getFieldValue(r, agg.field))
    .filter((v): v is number => typeof v === 'number');

  switch (agg.function) {
    case 'count':
      return records.length;

    case 'sum':
      return values.reduce((a, b) => a + b, 0);

    case 'avg':
      if (values.length === 0) return null;
      return values.reduce((a, b) => a + b, 0) / values.length;

    case 'min':
      if (values.length === 0) return null;
      return Math.min(...values);

    case 'max':
      if (values.length === 0) return null;
      return Math.max(...values);

    default:
      return null;
  }
}

/**
 * Group records by fields
 */
function groupRecords(
  records: unknown[],
  groupBy: string[]
): Map<string, unknown[]> {
  const groups = new Map<string, unknown[]>();

  for (const record of records) {
    const keyParts = groupBy.map((field) => {
      const value = getFieldValue(record, field);
      return serializeGroupKeyPart(value);
    });

    const key = keyParts.join('|');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  }

  return groups;
}

/**
 * Serialize a value for use in a group key
 */
function serializeGroupKeyPart(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Parse a group key part back to a value
 */
function parseGroupKeyPart(part: string): unknown {
  if (part === 'null') return null;
  if (part === 'undefined') return undefined;

  // Try to parse as JSON
  try {
    return JSON.parse(part);
  } catch {
    // Try to parse as number
    const num = Number(part);
    if (!isNaN(num)) return num;

    // Return as string
    return part;
  }
}

/**
 * Apply having filter to aggregation results
 */
function applyHavingFilter(
  results: Record<string, unknown>[],
  having: Where
): Record<string, unknown>[] {
  return results.filter((result) => {
    for (const condition of having) {
      const value = result[condition.field];

      switch (condition.operator) {
        case 'eq':
          if (value !== condition.value) return false;
          break;
        case 'ne':
          if (value === condition.value) return false;
          break;
        case 'gt':
          if (typeof value !== 'number' || value <= (condition.value as number))
            return false;
          break;
        case 'gte':
          if (typeof value !== 'number' || value < (condition.value as number))
            return false;
          break;
        case 'lt':
          if (typeof value !== 'number' || value >= (condition.value as number))
            return false;
          break;
        case 'lte':
          if (typeof value !== 'number' || value > (condition.value as number))
            return false;
          break;
        case 'in':
          if (!Array.isArray(condition.value) || !condition.value.includes(value))
            return false;
          break;
      }
    }
    return true;
  });
}

/**
 * Sort results by order specification
 */
function sortResults(
  results: Record<string, unknown>[],
  orderBy: SortBy[]
): Record<string, unknown>[] {
  return [...results].sort((a, b) => {
    for (const order of orderBy) {
      const aValue = a[order.field];
      const bValue = b[order.field];

      let comparison = 0;

      if (aValue === bValue) {
        comparison = 0;
      } else if (aValue === null || aValue === undefined) {
        comparison = 1;
      } else if (bValue === null || bValue === undefined) {
        comparison = -1;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      if (comparison !== 0) {
        return order.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}
