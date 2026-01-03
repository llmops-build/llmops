import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

/**
 * Schema for inserting a new LLM request log
 */
const insertLLMRequestSchema = z.object({
  requestId: z.string().uuid(),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  inputCost: z.number().int().default(0),
  outputCost: z.number().int().default(0),
  endpoint: z.string(),
  statusCode: z.number().int(),
  latencyMs: z.number().int().default(0),
  isStreaming: z.boolean().default(false),
  userId: z.string().nullable().optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

export type LLMRequestInsert = z.infer<typeof insertLLMRequestSchema>;

/**
 * Schema for listing LLM requests
 */
const listRequestsSchema = z.object({
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  configId: z.string().uuid().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Schema for date range queries
 */
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

/**
 * Schema for cost summary with grouping
 */
const costSummarySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['day', 'hour', 'model', 'provider', 'config']).optional(),
});

/**
 * Helper to create column reference for SQL
 * Uses sql.ref() to properly quote column names for the database
 */
const col = (name: string) => sql.ref(name);
const tableCol = (table: string, name: string) => sql.ref(`${table}.${name}`);

export const createLLMRequestsDataLayer = (db: Kysely<Database>) => {
  return {
    /**
     * Batch insert LLM request logs
     * Used by the BatchWriter service for efficient writes
     */
    batchInsertRequests: async (requests: LLMRequestInsert[]) => {
      if (requests.length === 0) return { count: 0 };

      // Validate all requests
      const validatedRequests = await Promise.all(
        requests.map(async (req) => {
          const result = await insertLLMRequestSchema.safeParseAsync(req);
          if (!result.success) {
            throw new LLMOpsError(
              `Invalid request data: ${result.error.message}`
            );
          }
          return result.data;
        })
      );

      const now = new Date().toISOString();
      const values = validatedRequests.map((req) => ({
        id: randomUUID(),
        requestId: req.requestId,
        configId: req.configId ?? null,
        variantId: req.variantId ?? null,
        provider: req.provider,
        model: req.model,
        promptTokens: req.promptTokens,
        completionTokens: req.completionTokens,
        totalTokens: req.totalTokens,
        cachedTokens: req.cachedTokens,
        cost: req.cost,
        inputCost: req.inputCost,
        outputCost: req.outputCost,
        endpoint: req.endpoint,
        statusCode: req.statusCode,
        latencyMs: req.latencyMs,
        isStreaming: req.isStreaming,
        userId: req.userId ?? null,
        tags: JSON.stringify(req.tags),
        createdAt: now,
        updatedAt: now,
      }));

      await db.insertInto('llm_requests').values(values).execute();

      return { count: values.length };
    },

    /**
     * Insert a single LLM request log
     */
    insertRequest: async (request: LLMRequestInsert) => {
      const result = await insertLLMRequestSchema.safeParseAsync(request);
      if (!result.success) {
        throw new LLMOpsError(`Invalid request data: ${result.error.message}`);
      }

      const req = result.data;
      const now = new Date().toISOString();

      return db
        .insertInto('llm_requests')
        .values({
          id: randomUUID(),
          requestId: req.requestId,
          configId: req.configId ?? null,
          variantId: req.variantId ?? null,
          provider: req.provider,
          model: req.model,
          promptTokens: req.promptTokens,
          completionTokens: req.completionTokens,
          totalTokens: req.totalTokens,
          cachedTokens: req.cachedTokens,
          cost: req.cost,
          inputCost: req.inputCost,
          outputCost: req.outputCost,
          endpoint: req.endpoint,
          statusCode: req.statusCode,
          latencyMs: req.latencyMs,
          isStreaming: req.isStreaming,
          userId: req.userId ?? null,
          tags: JSON.stringify(req.tags),
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * List LLM requests with filtering and pagination
     * Returns data and total count for pagination
     */
    listRequests: async (params?: z.infer<typeof listRequestsSchema>) => {
      const result = await listRequestsSchema.safeParseAsync(params || {});
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { limit, offset, configId, provider, model, startDate, endDate } =
        result.data;

      // Build base query with filters
      let baseQuery = db.selectFrom('llm_requests');

      if (configId) {
        baseQuery = baseQuery.where('configId', '=', configId);
      }
      if (provider) {
        baseQuery = baseQuery.where('provider', '=', provider);
      }
      if (model) {
        baseQuery = baseQuery.where('model', '=', model);
      }
      if (startDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`
        );
      }
      if (endDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`
        );
      }

      // Get total count
      const countResult = await baseQuery
        .select(sql<number>`COUNT(*)`.as('total'))
        .executeTakeFirst();

      const total = Number(countResult?.total ?? 0);

      // Get paginated data
      const data = await baseQuery
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      return {
        data,
        total,
        limit,
        offset,
      };
    },

    /**
     * Get a single request by requestId
     */
    getRequestByRequestId: async (requestId: string) => {
      return db
        .selectFrom('llm_requests')
        .selectAll()
        .where('requestId', '=', requestId)
        .executeTakeFirst();
    },

    /**
     * Get total cost for a date range
     */
    getTotalCost: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      const data = await db
        .selectFrom('llm_requests')
        .select([
          sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('inputCost')}), 0)`.as(
            'totalInputCost'
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost'
          ),
          sql<number>`COALESCE(SUM(${col('promptTokens')}), 0)`.as(
            'totalPromptTokens'
          ),
          sql<number>`COALESCE(SUM(${col('completionTokens')}), 0)`.as(
            'totalCompletionTokens'
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens'
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`)
        .executeTakeFirst();

      return data;
    },

    /**
     * Get cost breakdown by model
     */
    getCostByModel: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      return db
        .selectFrom('llm_requests')
        .select([
          'provider',
          'model',
          sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('inputCost')}), 0)`.as(
            'totalInputCost'
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost'
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens'
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
          sql<number>`AVG(${col('latencyMs')})`.as('avgLatencyMs'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`)
        .groupBy(['provider', 'model'])
        .orderBy(sql`SUM(${col('cost')})`, 'desc')
        .execute();
    },

    /**
     * Get cost breakdown by provider
     */
    getCostByProvider: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      return db
        .selectFrom('llm_requests')
        .select([
          'provider',
          sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('inputCost')}), 0)`.as(
            'totalInputCost'
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost'
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens'
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
          sql<number>`AVG(${col('latencyMs')})`.as('avgLatencyMs'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`)
        .groupBy('provider')
        .orderBy(sql`SUM(${col('cost')})`, 'desc')
        .execute();
    },

    /**
     * Get cost breakdown by config
     */
    getCostByConfig: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      return db
        .selectFrom('llm_requests')
        .leftJoin('configs', 'llm_requests.configId', 'configs.id')
        .select([
          'llm_requests.configId',
          'configs.name as configName',
          'configs.slug as configSlug',
          sql<number>`COALESCE(SUM(${tableCol('llm_requests', 'cost')}), 0)`.as(
            'totalCost'
          ),
          sql<number>`COALESCE(SUM(${tableCol('llm_requests', 'inputCost')}), 0)`.as(
            'totalInputCost'
          ),
          sql<number>`COALESCE(SUM(${tableCol('llm_requests', 'outputCost')}), 0)`.as(
            'totalOutputCost'
          ),
          sql<number>`COALESCE(SUM(${tableCol('llm_requests', 'totalTokens')}), 0)`.as(
            'totalTokens'
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
        ])
        .where(
          sql<boolean>`${tableCol('llm_requests', 'createdAt')} >= ${startDate.toISOString()}`
        )
        .where(
          sql<boolean>`${tableCol('llm_requests', 'createdAt')} <= ${endDate.toISOString()}`
        )
        .groupBy(['llm_requests.configId', 'configs.name', 'configs.slug'])
        .orderBy(sql`SUM(${tableCol('llm_requests', 'cost')})`, 'desc')
        .execute();
    },

    /**
     * Get daily cost summary
     */
    getDailyCosts: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      return db
        .selectFrom('llm_requests')
        .select([
          sql<string>`DATE(${col('createdAt')})`.as('date'),
          sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('inputCost')}), 0)`.as(
            'totalInputCost'
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost'
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens'
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`)
        .groupBy(sql`DATE(${col('createdAt')})`)
        .orderBy(sql`DATE(${col('createdAt')})`, 'asc')
        .execute();
    },

    /**
     * Get cost summary with flexible grouping
     */
    getCostSummary: async (params: z.infer<typeof costSummarySchema>) => {
      const result = await costSummarySchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate, groupBy } = result.data;

      // Base query with date filter
      const baseQuery = db
        .selectFrom('llm_requests')
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`);

      // Add grouping based on parameter
      switch (groupBy) {
        case 'day':
          return baseQuery
            .select([
              sql<string>`DATE(${col('createdAt')})`.as('groupKey'),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
              sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
                'totalTokens'
              ),
            ])
            .groupBy(sql`DATE(${col('createdAt')})`)
            .orderBy(sql`DATE(${col('createdAt')})`, 'asc')
            .execute();

        case 'hour':
          return baseQuery
            .select([
              sql<string>`DATE_TRUNC('hour', ${col('createdAt')})`.as(
                'groupKey'
              ),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
              sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
                'totalTokens'
              ),
            ])
            .groupBy(sql`DATE_TRUNC('hour', ${col('createdAt')})`)
            .orderBy(sql`DATE_TRUNC('hour', ${col('createdAt')})`, 'asc')
            .execute();

        case 'model':
          return baseQuery
            .select([
              sql<string>`${col('provider')} || '/' || ${col('model')}`.as(
                'groupKey'
              ),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .groupBy(['provider', 'model'])
            .orderBy(sql`SUM(${col('cost')})`, 'desc')
            .execute();

        case 'provider':
          return baseQuery
            .select([
              sql<string>`${col('provider')}`.as('groupKey'),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .groupBy('provider')
            .orderBy(sql`SUM(${col('cost')})`, 'desc')
            .execute();

        case 'config':
          return baseQuery
            .select([
              sql<string>`COALESCE(${col('configId')}::text, 'no-config')`.as(
                'groupKey'
              ),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .groupBy('configId')
            .orderBy(sql`SUM(${col('cost')})`, 'desc')
            .execute();

        default:
          // No grouping - return totals
          return baseQuery
            .select([
              sql<string>`'total'`.as('groupKey'),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .execute();
      }
    },

    /**
     * Get request count and stats for a time range
     */
    getRequestStats: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate } = result.data;

      const data = await db
        .selectFrom('llm_requests')
        .select([
          sql<number>`COUNT(*)`.as('totalRequests'),
          sql<number>`COUNT(CASE WHEN ${col('statusCode')} >= 200 AND ${col('statusCode')} < 300 THEN 1 END)`.as(
            'successfulRequests'
          ),
          sql<number>`COUNT(CASE WHEN ${col('statusCode')} >= 400 THEN 1 END)`.as(
            'failedRequests'
          ),
          sql<number>`COUNT(CASE WHEN ${col('isStreaming')} = true THEN 1 END)`.as(
            'streamingRequests'
          ),
          sql<number>`AVG(${col('latencyMs')})`.as('avgLatencyMs'),
          sql<number>`MAX(${col('latencyMs')})`.as('maxLatencyMs'),
          sql<number>`MIN(${col('latencyMs')})`.as('minLatencyMs'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`)
        .executeTakeFirst();

      return data;
    },
  };
};
