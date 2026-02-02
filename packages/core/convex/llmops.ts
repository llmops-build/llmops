/**
 * LLMOps Generic CRUD Functions
 *
 * These functions provide generic database operations that the Convex adapter calls.
 * Users deploying to Convex should copy this file to their Convex project.
 *
 * The adapter converts model names (snake_case) to Convex table names (camelCase)
 * before calling these functions.
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Filter condition type for queries
 */
const filterCondition = v.object({
  field: v.string(),
  operator: v.string(), // 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains' | 'starts_with' | 'ends_with'
  value: v.any(),
});

/**
 * Order by type for queries
 */
const orderByCondition = v.object({
  field: v.string(),
  direction: v.string(), // 'asc' | 'desc'
});

/**
 * Apply a single filter condition to check if a document matches
 */
function matchesCondition(
  doc: Record<string, unknown>,
  filter: { field: string; operator: string; value: unknown }
): boolean {
  const fieldValue = doc[filter.field];
  const { operator, value } = filter;

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'ne':
      return fieldValue !== value;
    case 'lt':
      return (fieldValue as number) < (value as number);
    case 'lte':
      return (fieldValue as number) <= (value as number);
    case 'gt':
      return (fieldValue as number) > (value as number);
    case 'gte':
      return (fieldValue as number) >= (value as number);
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'contains':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.includes(value)
      );
    case 'starts_with':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.startsWith(value)
      );
    case 'ends_with':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.endsWith(value)
      );
    default:
      return fieldValue === value;
  }
}

/**
 * Check if a document matches all filter conditions
 */
function matchesAllConditions(
  doc: Record<string, unknown>,
  filters: Array<{ field: string; operator: string; value: unknown }>
): boolean {
  return filters.every((filter) => matchesCondition(doc, filter));
}

/**
 * Create a single document
 */
export const create = mutation({
  args: {
    table: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { table, data }) => {
    // Insert the document with the provided data
    // The data should already include id, createdAt, updatedAt from the adapter
    const id = await ctx.db.insert(table as any, data);
    return ctx.db.get(id);
  },
});

/**
 * Find a single document matching the filter conditions
 */
export const findOne = query({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
  },
  handler: async (ctx, { table, filter }) => {
    // If filtering by 'id' field, use the index
    const idFilter = filter.find(
      (f) => f.field === 'id' && f.operator === 'eq'
    );

    if (idFilter) {
      // Use index for id lookup
      const results = await ctx.db
        .query(table as any)
        .withIndex('by_id', (q) => q.eq('id', idFilter.value as string))
        .first();
      return results;
    }

    // Otherwise, scan and filter
    const allDocs = await ctx.db.query(table as any).collect();
    const matching = allDocs.find((doc) =>
      matchesAllConditions(doc as Record<string, unknown>, filter)
    );
    return matching ?? null;
  },
});

/**
 * Find multiple documents with optional filtering, ordering, limit, and offset
 */
export const findMany = query({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
    orderBy: v.optional(v.array(orderByCondition)),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { table, filter, orderBy, limit, offset }) => {
    // Get all documents from the table
    let docs = await ctx.db.query(table as any).collect();

    // Apply filters
    if (filter.length > 0) {
      docs = docs.filter((doc) =>
        matchesAllConditions(doc as Record<string, unknown>, filter)
      );
    }

    // Apply ordering
    if (orderBy && orderBy.length > 0) {
      docs.sort((a, b) => {
        for (const order of orderBy) {
          const aVal = (a as Record<string, unknown>)[order.field];
          const bVal = (b as Record<string, unknown>)[order.field];

          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;

          if (comparison !== 0) {
            return order.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply offset
    if (offset !== undefined && offset > 0) {
      docs = docs.slice(offset);
    }

    // Apply limit
    if (limit !== undefined) {
      docs = docs.slice(0, limit);
    }

    return docs;
  },
});

/**
 * Update a single document matching the filter conditions
 */
export const update = mutation({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
    data: v.any(),
  },
  handler: async (ctx, { table, filter, data }) => {
    // Find the document to update
    const idFilter = filter.find(
      (f) => f.field === 'id' && f.operator === 'eq'
    );

    let docToUpdate;

    if (idFilter) {
      docToUpdate = await ctx.db
        .query(table as any)
        .withIndex('by_id', (q) => q.eq('id', idFilter.value as string))
        .first();
    } else {
      const allDocs = await ctx.db.query(table as any).collect();
      docToUpdate = allDocs.find((doc) =>
        matchesAllConditions(doc as Record<string, unknown>, filter)
      );
    }

    if (!docToUpdate) {
      return null;
    }

    // Update the document
    await ctx.db.patch(docToUpdate._id, data);

    // Return the updated document
    return ctx.db.get(docToUpdate._id);
  },
});

/**
 * Delete a single document matching the filter conditions
 */
export const deleteOne = mutation({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
  },
  handler: async (ctx, { table, filter }) => {
    // Find the document to delete
    const idFilter = filter.find(
      (f) => f.field === 'id' && f.operator === 'eq'
    );

    let docToDelete;

    if (idFilter) {
      docToDelete = await ctx.db
        .query(table as any)
        .withIndex('by_id', (q) => q.eq('id', idFilter.value as string))
        .first();
    } else {
      const allDocs = await ctx.db.query(table as any).collect();
      docToDelete = allDocs.find((doc) =>
        matchesAllConditions(doc as Record<string, unknown>, filter)
      );
    }

    if (!docToDelete) {
      return null;
    }

    // Delete the document
    await ctx.db.delete(docToDelete._id);

    // Return the deleted document (without _id as it's now invalid)
    const { _id, ...rest } = docToDelete;
    return rest;
  },
});

/**
 * Create multiple documents at once
 */
export const createMany = mutation({
  args: {
    table: v.string(),
    data: v.array(v.any()),
  },
  handler: async (ctx, { table, data }) => {
    const results = [];

    for (const item of data) {
      const id = await ctx.db.insert(table as any, item);
      const doc = await ctx.db.get(id);
      results.push(doc);
    }

    return results;
  },
});

/**
 * Delete multiple documents matching the filter conditions
 */
export const deleteMany = mutation({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
  },
  handler: async (ctx, { table, filter }) => {
    // Get all documents
    let docs = await ctx.db.query(table as any).collect();

    // Apply filters
    if (filter.length > 0) {
      docs = docs.filter((doc) =>
        matchesAllConditions(doc as Record<string, unknown>, filter)
      );
    }

    // Delete all matching documents
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    return docs.length;
  },
});

/**
 * Count documents matching the filter conditions
 */
export const count = query({
  args: {
    table: v.string(),
    filter: v.array(filterCondition),
  },
  handler: async (ctx, { table, filter }) => {
    // Get all documents
    let docs = await ctx.db.query(table as any).collect();

    // Apply filters
    if (filter.length > 0) {
      docs = docs.filter((doc) =>
        matchesAllConditions(doc as Record<string, unknown>, filter)
      );
    }

    return docs.length;
  },
});
