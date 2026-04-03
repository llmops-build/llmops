import { Kysely as KyselyClass, PostgresDialect, CompiledQuery } from 'kysely';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';
import type { Database } from '../db/schema';
import { LLMOpsError } from '../error';
import { logger } from '../utils/logger';

// ─── LLM Requests schemas ──────────────────────────────────────────────────

const guardrailResultSchema = z.object({
  checkId: z.string(),
  functionId: z.string(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  verdict: z.boolean(),
  latencyMs: z.number(),
});

const guardrailResultsSchema = z.object({
  results: z.array(guardrailResultSchema),
  action: z.enum(['allowed', 'blocked', 'logged']),
  totalLatencyMs: z.number(),
});

const insertLLMRequestSchema = z.object({
  requestId: z.string().uuid(),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
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
  tags: z.record(z.string(), z.array(z.string())).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(),
});

export const COST_SUMMARY_GROUP_BY = [
  'day',
  'hour',
  'model',
  'provider',
  'endpoint',
  'tags',
] as const;

export type CostSummaryGroupBy = (typeof COST_SUMMARY_GROUP_BY)[number];

const costSummarySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(),
  groupBy: z.enum(COST_SUMMARY_GROUP_BY).optional(),
  tagKeys: z.array(z.string()).optional(),
});

// ─── Traces schemas ─────────────────────────────────────────────────────────

const upsertTraceSchema = z.object({
  traceId: z.string(),
  name: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  status: z.enum(['unset', 'ok', 'error']).default('unset'),
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  spanCount: z.number().int().default(1),
  totalInputTokens: z.number().int().default(0),
  totalOutputTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  totalCost: z.number().int().default(0),
  tags: z.record(z.string(), z.string()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type TraceUpsert = z.infer<typeof upsertTraceSchema>;

const insertSpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().nullable().optional(),
  name: z.string(),
  kind: z.number().int().default(1),
  status: z.number().int().default(0),
  statusMessage: z.string().nullable().optional(),
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  provider: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
  requestId: z.string().uuid().nullable().optional(),
  source: z.enum(['gateway', 'otlp', 'langsmith']).default('gateway'),
  input: z.unknown().nullable().optional(),
  output: z.unknown().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type SpanInsert = z.infer<typeof insertSpanSchema>;

const insertSpanEventSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  name: z.string(),
  timestamp: z.date(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type SpanEventInsert = z.infer<typeof insertSpanEventSchema>;

const listTracesSchema = z.object({
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().nonnegative().default(0),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['unset', 'ok', 'error']).optional(),
  name: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tags: z.record(z.string(), z.array(z.string())).optional(),
});

const traceStatsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const col = (name: string) => sql.ref(name);

// ─── LLM Requests store ────────────────────────────────────────────────────

function createLLMRequestsStore(db: Kysely<Database>) {
  return {
    batchInsertRequests: async (requests: LLMRequestInsert[]) => {
      if (requests.length === 0) return { count: 0 };

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

      let baseQuery = db.selectFrom('llm_requests');

      if (configId) baseQuery = baseQuery.where('configId', '=', configId);
      if (variantId) baseQuery = baseQuery.where('variantId', '=', variantId);
      if (environmentId)
        baseQuery = baseQuery.where('environmentId', '=', environmentId);
      if (providerConfigId)
        baseQuery = baseQuery.where('providerConfigId', '=', providerConfigId);
      if (provider) baseQuery = baseQuery.where('provider', '=', provider);
      if (model) baseQuery = baseQuery.where('model', '=', model);
      if (startDate)
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`,
        );
      if (endDate)
        baseQuery = baseQuery.where(
          sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`,
        );
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

      const countResult = await baseQuery
        .select(sql<number>`COUNT(*)`.as('total'))
        .executeTakeFirst();
      const total = Number(countResult?.total ?? 0);

      const data = await baseQuery
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      return { data, total, limit, offset };
    },

    getRequestByRequestId: async (requestId: string) => {
      return db
        .selectFrom('llm_requests')
        .selectAll()
        .where('requestId', '=', requestId)
        .executeTakeFirst();
    },

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

      if (configId) query = query.where('configId', '=', configId);
      if (variantId) query = query.where('variantId', '=', variantId);
      if (environmentId)
        query = query.where('environmentId', '=', environmentId);
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

      return query.executeTakeFirst();
    },

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

      let baseQuery = db
        .selectFrom('llm_requests')
        .where(sql<boolean>`${col('createdAt')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('createdAt')} <= ${endDate.toISOString()}`);

      if (configId) baseQuery = baseQuery.where('configId', '=', configId);
      if (variantId) baseQuery = baseQuery.where('variantId', '=', variantId);
      if (environmentId)
        baseQuery = baseQuery.where('environmentId', '=', environmentId);
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
          const conditions = [
            sql`${col('createdAt')} >= ${startDate.toISOString()}`,
            sql`${col('createdAt')} <= ${endDate.toISOString()}`,
          ];
          if (configId)
            conditions.push(sql`${col('configId')} = ${configId}`);
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
                conditions.push(
                  sql`${col('tags')}->>${key} IN (${valueList})`,
                );
              }
            }
          }
          if (tagKeys && tagKeys.length > 0) {
            const tagKeyList = sql.join(
              tagKeys.map((k) => sql`${k}`),
              sql`, `,
            );
            conditions.push(sql`t.key IN (${tagKeyList})`);
          }
          const whereClause = sql.join(conditions, sql` AND `);
          const tagResult = await sql<{
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
          return tagResult.rows;
        }

        default:
          return baseQuery
            .select([
              sql<string>`'total'`.as('groupKey'),
              sql<number>`COALESCE(SUM(${col('cost')}), 0)`.as('totalCost'),
              sql<number>`COUNT(*)`.as('requestCount'),
            ])
            .execute();
      }
    },

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

      if (configId) query = query.where('configId', '=', configId);
      if (variantId) query = query.where('variantId', '=', variantId);
      if (environmentId)
        query = query.where('environmentId', '=', environmentId);
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

      return query.executeTakeFirst();
    },

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
}

// ─── Traces store ───────────────────────────────────────────────────────────

function createTracesStore(db: Kysely<Database>) {
  return {
    upsertTrace: async (data: TraceUpsert) => {
      const result = await upsertTraceSchema.safeParseAsync(data);
      if (!result.success) {
        throw new LLMOpsError(`Invalid trace data: ${result.error.message}`);
      }

      const trace = result.data;
      const now = new Date().toISOString();

      await sql`
        INSERT INTO "traces" (
          "id", "traceId", "name", "sessionId", "userId", "status",
          "startTime", "endTime", "durationMs", "spanCount",
          "totalInputTokens", "totalOutputTokens", "totalTokens", "totalCost",
          "tags", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          ${randomUUID()}, ${trace.traceId}, ${trace.name ?? null}, ${trace.sessionId ?? null},
          ${trace.userId ?? null}, ${trace.status},
          ${trace.startTime.toISOString()}, ${trace.endTime?.toISOString() ?? null},
          ${trace.durationMs ?? null}, ${trace.spanCount},
          ${trace.totalInputTokens}, ${trace.totalOutputTokens},
          ${trace.totalTokens}, ${trace.totalCost},
          ${JSON.stringify(trace.tags)}::jsonb, ${JSON.stringify(trace.metadata)}::jsonb,
          ${now}, ${now}
        )
        ON CONFLICT ("traceId") DO UPDATE SET
          "name" = COALESCE(EXCLUDED."name", "traces"."name"),
          "sessionId" = COALESCE(EXCLUDED."sessionId", "traces"."sessionId"),
          "userId" = COALESCE(EXCLUDED."userId", "traces"."userId"),
          "status" = CASE
            WHEN EXCLUDED."status" = 'error' THEN 'error'
            WHEN EXCLUDED."status" = 'ok' AND "traces"."status" != 'error' THEN 'ok'
            ELSE "traces"."status"
          END,
          "startTime" = LEAST("traces"."startTime", EXCLUDED."startTime"),
          "endTime" = GREATEST(
            COALESCE("traces"."endTime", EXCLUDED."endTime"),
            COALESCE(EXCLUDED."endTime", "traces"."endTime")
          ),
          "durationMs" = EXTRACT(EPOCH FROM (
            GREATEST(
              COALESCE("traces"."endTime", EXCLUDED."endTime"),
              COALESCE(EXCLUDED."endTime", "traces"."endTime")
            ) -
            LEAST("traces"."startTime", EXCLUDED."startTime")
          ))::integer * 1000,
          "spanCount" = "traces"."spanCount" + EXCLUDED."spanCount",
          "totalInputTokens" = "traces"."totalInputTokens" + EXCLUDED."totalInputTokens",
          "totalOutputTokens" = "traces"."totalOutputTokens" + EXCLUDED."totalOutputTokens",
          "totalTokens" = "traces"."totalTokens" + EXCLUDED."totalTokens",
          "totalCost" = "traces"."totalCost" + EXCLUDED."totalCost",
          "tags" = "traces"."tags" || EXCLUDED."tags",
          "metadata" = "traces"."metadata" || EXCLUDED."metadata",
          "updatedAt" = ${now}
      `.execute(db);
    },

    batchInsertSpans: async (spans: SpanInsert[]) => {
      if (spans.length === 0) return { count: 0 };

      const validatedSpans: z.infer<typeof insertSpanSchema>[] = [];
      for (const span of spans) {
        const result = await insertSpanSchema.safeParseAsync(span);
        if (!result.success) {
          logger.warn(
            `[batchInsertSpans] Skipping invalid span ${span.spanId}: ${result.error.message}`,
          );
          continue;
        }
        validatedSpans.push(result.data);
      }

      if (validatedSpans.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const values = validatedSpans.map((span) => ({
        id: randomUUID(),
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId ?? null,
        name: span.name,
        kind: span.kind,
        status: span.status,
        statusMessage: span.statusMessage ?? null,
        startTime: span.startTime.toISOString(),
        endTime: span.endTime?.toISOString() ?? null,
        durationMs: span.durationMs ?? null,
        provider: span.provider ?? null,
        model: span.model ?? null,
        promptTokens: span.promptTokens,
        completionTokens: span.completionTokens,
        totalTokens: span.totalTokens,
        cost: span.cost,
        configId: span.configId ?? null,
        variantId: span.variantId ?? null,
        environmentId: span.environmentId ?? null,
        providerConfigId: span.providerConfigId ?? null,
        requestId: span.requestId ?? null,
        source: span.source,
        input: span.input != null ? JSON.stringify(span.input) : null,
        output: span.output != null ? JSON.stringify(span.output) : null,
        attributes: JSON.stringify(span.attributes),
        createdAt: now,
        updatedAt: now,
      }));

      await db
        .insertInto('spans')
        .values(values)
        .onConflict((oc) => oc.column('spanId').doNothing())
        .execute();

      return { count: values.length };
    },

    batchInsertSpanEvents: async (events: SpanEventInsert[]) => {
      if (events.length === 0) return { count: 0 };

      const validatedEvents: z.infer<typeof insertSpanEventSchema>[] = [];
      for (const event of events) {
        const result = await insertSpanEventSchema.safeParseAsync(event);
        if (!result.success) {
          logger.warn(
            `[batchInsertSpanEvents] Skipping invalid event: ${result.error.message}`,
          );
          continue;
        }
        validatedEvents.push(result.data);
      }

      if (validatedEvents.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const values = validatedEvents.map((event) => ({
        id: randomUUID(),
        traceId: event.traceId,
        spanId: event.spanId,
        name: event.name,
        timestamp: event.timestamp.toISOString(),
        attributes: JSON.stringify(event.attributes),
        createdAt: now,
      }));

      await db.insertInto('span_events').values(values).execute();
      return { count: values.length };
    },

    listTraces: async (params?: z.infer<typeof listTracesSchema>) => {
      const result = await listTracesSchema.safeParseAsync(params || {});
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const {
        limit,
        offset,
        sessionId,
        userId,
        status,
        name,
        startDate,
        endDate,
        tags,
      } = result.data;

      let baseQuery = db.selectFrom('traces');

      if (sessionId) baseQuery = baseQuery.where('sessionId', '=', sessionId);
      if (userId) baseQuery = baseQuery.where('userId', '=', userId);
      if (status) baseQuery = baseQuery.where('status', '=', status);
      if (name)
        baseQuery = baseQuery.where(
          sql<boolean>`${col('name')} ILIKE ${'%' + name + '%'}`,
        );
      if (startDate)
        baseQuery = baseQuery.where(
          sql<boolean>`${col('startTime')} >= ${startDate.toISOString()}`,
        );
      if (endDate)
        baseQuery = baseQuery.where(
          sql<boolean>`${col('startTime')} <= ${endDate.toISOString()}`,
        );
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

      const countResult = await baseQuery
        .select(sql<number>`COUNT(*)`.as('total'))
        .executeTakeFirst();
      const total = Number(countResult?.total ?? 0);

      const data = await baseQuery
        .selectAll()
        .orderBy('startTime', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      return { data, total, limit, offset };
    },

    getTraceWithSpans: async (traceId: string) => {
      const trace = await db
        .selectFrom('traces')
        .selectAll()
        .where('traceId', '=', traceId)
        .executeTakeFirst();

      if (!trace) return undefined;

      const spans = await db
        .selectFrom('spans')
        .selectAll()
        .where('traceId', '=', traceId)
        .orderBy('startTime', 'asc')
        .execute();

      const events = await db
        .selectFrom('span_events')
        .selectAll()
        .where('traceId', '=', traceId)
        .orderBy('timestamp', 'asc')
        .execute();

      return { trace, spans, events };
    },

    getTraceStats: async (params: z.infer<typeof traceStatsSchema>) => {
      const result = await traceStatsSchema.safeParseAsync(params);
      if (!result.success) {
        throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
      }

      const { startDate, endDate, sessionId, userId } = result.data;

      let query = db
        .selectFrom('traces')
        .select([
          sql<number>`COUNT(*)`.as('totalTraces'),
          sql<number>`COALESCE(AVG(${col('durationMs')}), 0)`.as(
            'avgDurationMs',
          ),
          sql<number>`COUNT(CASE WHEN ${col('status')} = 'error' THEN 1 END)`.as(
            'errorCount',
          ),
          sql<number>`COALESCE(SUM(${col('totalCost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as(
            'totalTokens',
          ),
          sql<number>`COALESCE(SUM(${col('spanCount')}), 0)`.as('totalSpans'),
        ])
        .where(sql<boolean>`${col('startTime')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('startTime')} <= ${endDate.toISOString()}`);

      if (sessionId) query = query.where('sessionId', '=', sessionId);
      if (userId) query = query.where('userId', '=', userId);

      return query.executeTakeFirst();
    },
  };
}

// ─── PgStore ────────────────────────────────────────────────────────────────

export type PgStore = ReturnType<typeof createLLMRequestsStore> &
  ReturnType<typeof createTracesStore> & {
    _db: Kysely<Database>;
  };

/**
 * Create a PostgreSQL-backed telemetry store.
 *
 * Usage:
 * ```ts
 * import { llmops } from '@llmops/sdk'
 * import { pgStore } from '@llmops/sdk/store/pg'
 *
 * const ops = llmops({
 *   telemetry: pgStore(process.env.DATABASE_URL),
 * })
 * ```
 */
const pgStoreOptionsSchema = z.object({
  schema: z.string().default('llmops'),
});

export function createPgStore(
  connectionString: string,
  options?: { schema?: string },
): PgStore {
  const parsed = z.string().url().safeParse(connectionString);
  if (!parsed.success) {
    throw new Error(
      `pgStore: invalid connection string — ${parsed.error.issues[0]?.message ?? 'expected a postgres:// URL'}`,
    );
  }

  const { schema } = pgStoreOptionsSchema.parse(options ?? {});

  let pool: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pg = require('pg');
    pool = new pg.Pool({ connectionString });
  } catch {
    throw new Error(
      'pgStore requires the "pg" package. Install it with: pnpm add pg',
    );
  }

  const dialect = new PostgresDialect({
    pool,
    onCreateConnection: async (connection) => {
      await connection.executeQuery(
        CompiledQuery.raw(`SET search_path TO "${schema}"`),
      );
    },
  });

  const db = new KyselyClass<Database>({ dialect });

  logger.debug(`pgStore: initialized with schema "${schema}"`);

  return {
    ...createLLMRequestsStore(db),
    ...createTracesStore(db),
    _db: db,
  };
}
