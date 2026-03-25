import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

/**
 * Schema for individual guardrail result in telemetry
 */
const guardrailResultSchema = z.object({
  checkId: z.string(), // Guardrail check ID (format: pluginId.functionId, e.g., "default.regexMatch")
  functionId: z.string(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  verdict: z.boolean(),
  latencyMs: z.number(),
});

/**
 * Schema for guardrail results aggregate
 */
const guardrailResultsSchema = z.object({
  results: z.array(guardrailResultSchema),
  action: z.enum(['allowed', 'blocked', 'logged']),
  totalLatencyMs: z.number(),
});

/**
 * Schema for inserting a new LLM request log
 */
const insertLLMRequestSchema = z.object({
  requestId: z.string().uuid(),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(), // Added providerConfigId
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0),
  cacheCreationTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  cacheSavings: z.number().int().default(0),
  inputCost: z.number().int().default(0),
  outputCost: z.number().int().default(0),
  endpoint: z.string(),
  statusCode: z.number().int(),
  latencyMs: z.number().int().default(0),
  isStreaming: z.boolean().default(false),
  userId: z.string().nullable().optional(),
  tags: z.record(z.string(), z.string()).default({}),
  guardrailResults: guardrailResultsSchema.nullable().optional(),
  traceId: z.string().nullable().optional(),
  spanId: z.string().nullable().optional(),
  parentSpanId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
});

export type LLMRequestInsert = z.infer<typeof insertLLMRequestSchema>;

/**
 * Schema for listing LLM requests
 */
const listRequestsSchema = z.object({
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  providerConfigId: z.string().uuid().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(), // { key: [value1, value2] }
});

/**
 * Schema for date range queries with optional filters
 */
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(), // { key: [value1, value2] }
});

/**
 * Valid groupBy values for cost summary queries
 */
export const COST_SUMMARY_GROUP_BY = [
  'day',
  'hour',
  'model',
  'provider',
  'endpoint',
  'tags',
] as const;

export type CostSummaryGroupBy = (typeof COST_SUMMARY_GROUP_BY)[number];

/**
 * Schema for cost summary with grouping
 */
const costSummarySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(), // { key: [value1, value2] }
  groupBy: z.enum(COST_SUMMARY_GROUP_BY).optional(),
  tagKeys: z.array(z.string()).optional(),
});

/**
 * Helper to create column reference for SQL
 * Uses sql.ref() to properly quote column names for the database
 */
const col = (name: string) => sql.ref(name);

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
              `Invalid request data: ${result.error.message}`,
            );
          }
          return result.data;
        }),
      );

      const now = new Date().toISOString();
      const values = validatedRequests.map((req) => ({
        id: randomUUID(),
        requestId: req.requestId,
        configId: req.configId ?? null,
        variantId: req.variantId ?? null,
        environmentId: req.environmentId ?? null,
        providerConfigId: req.providerConfigId ?? null,
        provider: req.provider,
        model: req.model,
        promptTokens: req.promptTokens,
        completionTokens: req.completionTokens,
        totalTokens: req.totalTokens,
        cachedTokens: req.cachedTokens,
        cacheCreationTokens: req.cacheCreationTokens,
        cost: req.cost,
        cacheSavings: req.cacheSavings,
        inputCost: req.inputCost,
        outputCost: req.outputCost,
        endpoint: req.endpoint,
        statusCode: req.statusCode,
        latencyMs: req.latencyMs,
        isStreaming: req.isStreaming,
        userId: req.userId ?? null,
        tags: JSON.stringify(req.tags),
        guardrailResults: req.guardrailResults
          ? JSON.stringify(req.guardrailResults)
          : null,
        traceId: req.traceId ?? null,
        spanId: req.spanId ?? null,
        parentSpanId: req.parentSpanId ?? null,
        sessionId: req.sessionId ?? null,
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
          environmentId: req.environmentId ?? null,
          providerConfigId: req.providerConfigId ?? null,
          provider: req.provider,
          model: req.model,
          promptTokens: req.promptTokens,
          completionTokens: req.completionTokens,
          totalTokens: req.totalTokens,
          cachedTokens: req.cachedTokens,
          cacheCreationTokens: req.cacheCreationTokens,
          cost: req.cost,
          cacheSavings: req.cacheSavings,
          inputCost: req.inputCost,
          outputCost: req.outputCost,
          endpoint: req.endpoint,
          statusCode: req.statusCode,
          latencyMs: req.latencyMs,
          isStreaming: req.isStreaming,
          userId: req.userId ?? null,
          tags: JSON.stringify(req.tags),
          guardrailResults: req.guardrailResults
            ? JSON.stringify(req.guardrailResults)
            : null,
          traceId: req.traceId ?? null,
          spanId: req.spanId ?? null,
          parentSpanId: req.parentSpanId ?? null,
          sessionId: req.sessionId ?? null,
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

      const {
        limit,
        offset,
        configId,
        variantId,
        environmentId,
        providerConfigId,
        provider,
        model,
        startDate,
        endDate,
        tags,
      } = result.data;

      // Build base query with filters
      let baseQuery = db.selectFrom('llm_requests');

      if (configId) {
        baseQuery = baseQuery.where('configId', '=', configId);
      }
      if (variantId) {
        baseQuery = baseQuery.where('variantId', '=', variantId);
      }
      if (environmentId) {
        baseQuery = baseQuery.where('environmentId', '=', environmentId);
      }
      if (providerConfigId) {
        baseQuery = baseQuery.where('providerConfigId', '=', providerConfigId);
      }
      if (provider) {
        baseQuery = baseQuery.where('provider', '=', provider);
      }
      if (model) {
        baseQuery = baseQuery.where('model', '=', model);
      }
      if (startDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`,
        );
      }
      if (endDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`,
        );
      }
      // Filter by tags - OR within same key, AND between keys
      if (tags && Object.keys(tags).length > 0) {
        for (const [key, values] of Object.entries(tags)) {
          if (values.length === 0) continue;
          if (values.length === 1) {
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} = ${values[0]}`,
            );
          } else {
            const valueList = sql.join(values.map((v) => sql`${v}`));
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} IN (${valueList})`,
            );
          }
        }
      }

      // Get total count
      const countQuery = baseQuery.select(sql<number>`COUNT(*)`.as('total'));
      const countResult = await countQuery.executeTakeFirst();

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
     * Get total cost for a date range with optional filters
     */
    getTotalCost: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate, configId, variantId, environmentId, tags } =
        result.data;

      let query = db
        .selectFrom('llm_requests')
        .select([
          sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('inputCost')}), 0)`.as(
            'totalInputCost',
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost',
          ),
          sql<number>`COALESCE(SUM(${col('promptTokens')}), 0)`.as(
            'totalPromptTokens',
          ),
          sql<number>`COALESCE(SUM(${col('completionTokens')}), 0)`.as(
            'totalCompletionTokens',
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens',
          ),
          sql<number>`COALESCE(SUM(${col('cachedTokens')}), 0)`.as(
            'totalCachedTokens',
          ),
          sql<number>`COALESCE(SUM(${col('cacheSavings')}), 0)`.as(
            'totalCacheSavings',
          ),
          sql<number>`COUNT(*)`.as('requestCount'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`);

      if (configId) {
        query = query.where('configId', '=', configId);
      }
      if (variantId) {
        query = query.where('variantId', '=', variantId);
      }
      if (environmentId) {
        query = query.where('environmentId', '=', environmentId);
      }
      // Filter by tags - OR within same key, AND between keys
      if (tags && Object.keys(tags).length > 0) {
        for (const [key, values] of Object.entries(tags)) {
          if (values.length === 0) continue;
          if (values.length === 1) {
            query = query.where(
              sql<boolean>`${col('tags')}->>${key} = ${values[0]}`,
            );
          } else {
            const valueList = sql.join(values.map((v) => sql`${v}`));
            query = query.where(
              sql<boolean>`${col('tags')}->>${key} IN (${valueList})`,
            );
          }
        }
      }

      const data = await query.executeTakeFirst();

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
            'totalInputCost',
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost',
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens',
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
            'totalInputCost',
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost',
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens',
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
            'totalInputCost',
          ),
          sql<number>`COALESCE(SUM(${col('outputCost')}), 0)`.as(
            'totalOutputCost',
          ),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens',
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
     * Get cost summary with flexible grouping and optional filters
     */
    getCostSummary: async (params: z.infer<typeof costSummarySchema>) => {
      const result = await costSummarySchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const {
        startDate,
        endDate,
        groupBy,
        configId,
        variantId,
        environmentId,
        tags,
        tagKeys,
      } = result.data;

      // Base query with date filter
      let baseQuery = db
        .selectFrom('llm_requests')
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`);

      // Apply optional filters
      if (configId) {
        baseQuery = baseQuery.where('configId', '=', configId);
      }
      if (variantId) {
        baseQuery = baseQuery.where('variantId', '=', variantId);
      }
      if (environmentId) {
        baseQuery = baseQuery.where('environmentId', '=', environmentId);
      }
      // Filter by tags - OR within same key, AND between keys
      if (tags && Object.keys(tags).length > 0) {
        for (const [key, values] of Object.entries(tags)) {
          if (values.length === 0) continue;
          if (values.length === 1) {
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} = ${values[0]}`,
            );
          } else {
            const valueList = sql.join(values.map((v) => sql`${v}`));
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} IN (${valueList})`,
            );
          }
        }
      }

      // Add grouping based on parameter
      switch (groupBy) {
        case 'day':
          return baseQuery
            .select([
              sql<string>`DATE(${col('createdAt')})`.as('groupKey'),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
              sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
                'totalTokens',
              ),
            ])
            .groupBy(sql`DATE(${col('createdAt')})`)
            .orderBy(sql`DATE(${col('createdAt')})`, 'asc')
            .execute();

        case 'hour':
          return baseQuery
            .select([
              sql<string>`DATE_TRUNC('hour', ${col('createdAt')})`.as(
                'groupKey',
              ),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
              sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
                'totalTokens',
              ),
            ])
            .groupBy(sql`DATE_TRUNC('hour', ${col('createdAt')})`)
            .orderBy(sql`DATE_TRUNC('hour', ${col('createdAt')})`, 'asc')
            .execute();

        case 'model':
          return baseQuery
            .select([
              sql<string>`${col('provider')} || '/' || ${col('model')}`.as(
                'groupKey',
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

        case 'endpoint':
          return baseQuery
            .select([
              sql<string>`COALESCE(${col('endpoint')}, 'unknown')`.as(
                'groupKey',
              ),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .groupBy('endpoint')
            .orderBy(sql`SUM(${col('cost')})`, 'desc')
            .execute();

        case 'tags': {
          // Unnest JSONB tags to group by individual tag key:value pairs
          // Uses raw SQL with jsonb_each_text for lateral expansion
          const conditions = [
            sql`${col('createdAt')} >= ${startDate.toISOString()}`,
            sql`${col('createdAt')} <= ${endDate.toISOString()}`,
          ];
          if (configId) conditions.push(sql`${col('configId')} = ${configId}`);
          if (variantId)
            conditions.push(sql`${col('variantId')} = ${variantId}`);
          if (environmentId)
            conditions.push(sql`${col('environmentId')} = ${environmentId}`);
          if (tags && Object.keys(tags).length > 0) {
            for (const [key, values] of Object.entries(tags)) {
              if (values.length === 0) continue;
              if (values.length === 1) {
                conditions.push(sql`${col('tags')}->>${key} = ${values[0]}`);
              } else {
                const valueList = sql.join(values.map((v) => sql`${v}`));
                conditions.push(sql`${col('tags')}->>${key} IN (${valueList})`);
              }
            }
          }
          // Filter to only selected tag keys when provided
          if (tagKeys && tagKeys.length > 0) {
            const tagKeyList = sql.join(
              tagKeys.map((k) => sql`${k}`),
              sql`, `,
            );
            conditions.push(sql`t.key IN (${tagKeyList})`);
          }
          const whereClause = sql.join(conditions, sql` AND `);
          const result = await sql<{
            groupKey: string;
            totalCost: number;
            requestCount: number;
          }>`
            SELECT t.key || ':' || t.value as "groupKey",
                   COALESCE(SUM(${col('cost')}), 0) as "totalCost",
                   COUNT(*) as "requestCount"
            FROM "llm_requests", jsonb_each_text(${col('tags')}) t
            WHERE ${whereClause}
            GROUP BY t.key, t.value
            ORDER BY SUM(${col('cost')}) DESC
          `.execute(db);
          return result.rows;
        }

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
     * Get request count and stats for a time range with optional filters
     */
    getRequestStats: async (params: z.infer<typeof dateRangeSchema>) => {
      const result = await dateRangeSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate, configId, variantId, environmentId, tags } =
        result.data;

      let query = db
        .selectFrom('llm_requests')
        .select([
          sql<number>`COUNT(*)`.as('totalRequests'),
          sql<number>`COUNT(CASE WHEN ${col('statusCode')} >= 200 AND ${col('statusCode')} < 300 THEN 1 END)`.as(
            'successfulRequests',
          ),
          sql<number>`COUNT(CASE WHEN ${col('statusCode')} >= 400 THEN 1 END)`.as(
            'failedRequests',
          ),
          sql<number>`COUNT(CASE WHEN ${col('isStreaming')} = true THEN 1 END)`.as(
            'streamingRequests',
          ),
          sql<number>`AVG(${col('latencyMs')})`.as('avgLatencyMs'),
          sql<number>`MAX(${col('latencyMs')})`.as('maxLatencyMs'),
          sql<number>`MIN(${col('latencyMs')})`.as('minLatencyMs'),
        ])
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`);

      if (configId) {
        query = query.where('configId', '=', configId);
      }
      if (variantId) {
        query = query.where('variantId', '=', variantId);
      }
      if (environmentId) {
        query = query.where('environmentId', '=', environmentId);
      }
      // Filter by tags - OR within same key, AND between keys
      if (tags && Object.keys(tags).length > 0) {
        for (const [key, values] of Object.entries(tags)) {
          if (values.length === 0) continue;
          if (values.length === 1) {
            query = query.where(
              sql<boolean>`${col('tags')}->>${key} = ${values[0]}`,
            );
          } else {
            const valueList = sql.join(values.map((v) => sql`${v}`));
            query = query.where(
              sql<boolean>`${col('tags')}->>${key} IN (${valueList})`,
            );
          }
        }
      }

      const data = await query.executeTakeFirst();

      return data;
    },

    /**
     * Get all distinct tag key-value pairs from llm_requests
     * Used for populating tag filter dropdowns in the UI
     */
    getDistinctTags: async () => {
      const data = await sql<{ key: string; value: string }>`
        SELECT DISTINCT key, value
        FROM llm_requests, jsonb_each_text(tags) AS t(key, value)
        WHERE tags != '{}'::jsonb
        ORDER BY key, value
      `.execute(db);

      return data.rows;
    },
  };
};
