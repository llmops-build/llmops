import { randomUUID } from 'node:crypto';
import z from 'zod';
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

export const COST_SUMMARY_GROUP_BY = [
  'day',
  'hour',
  'model',
  'provider',
  'endpoint',
  'tags',
] as const;

export type CostSummaryGroupBy = (typeof COST_SUMMARY_GROUP_BY)[number];

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

// ─── Tag filter helper ──────────────────────────────────────────────────────

function buildTagFilters(
  tags: Record<string, string[]> | undefined,
  paramOffset: number,
): { conditions: string[]; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (!tags) return { conditions, params };

  for (const [key, values] of Object.entries(tags)) {
    if (values.length === 0) continue;
    if (values.length === 1) {
      conditions.push(`"tags"->>'${key}' = $${paramOffset + params.length + 1}`);
      params.push(values[0]);
    } else {
      const placeholders = values
        .map((_, i) => `$${paramOffset + params.length + i + 1}`)
        .join(', ');
      conditions.push(`"tags"->>'${key}' IN (${placeholders})`);
      params.push(...values);
    }
  }
  return { conditions, params };
}

// ─── LLM Requests store ────────────────────────────────────────────────────

function createLLMRequestsStore(pool: any) {
  return {
    batchInsertRequests: async (requests: LLMRequestInsert[]) => {
      if (requests.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const columns = [
        'id', 'requestId', 'configId', 'variantId', 'environmentId',
        'providerConfigId', 'provider', 'model', 'promptTokens',
        'completionTokens', 'totalTokens', 'cachedTokens',
        'cacheCreationTokens', 'cost', 'cacheSavings', 'inputCost',
        'outputCost', 'endpoint', 'statusCode', 'latencyMs', 'isStreaming',
        'userId', 'tags', 'guardrailResults', 'traceId', 'spanId',
        'parentSpanId', 'sessionId', 'createdAt', 'updatedAt',
      ];
      const colNames = columns.map((c) => `"${c}"`).join(', ');
      const params: unknown[] = [];
      const valueRows: string[] = [];

      for (const req of requests) {
        const result = insertLLMRequestSchema.safeParse(req);
        if (!result.success) {
          logger.warn(`[batchInsertRequests] Skipping invalid request: ${result.error.message}`);
          continue;
        }
        const r = result.data;
        const offset = params.length;
        const placeholders = columns.map((_, i) => `$${offset + i + 1}`).join(', ');
        valueRows.push(`(${placeholders})`);
        params.push(
          randomUUID(), r.requestId, r.configId ?? null,
          r.variantId ?? null, r.environmentId ?? null,
          r.providerConfigId ?? null, r.provider, r.model,
          r.promptTokens, r.completionTokens, r.totalTokens,
          r.cachedTokens, r.cacheCreationTokens, r.cost,
          r.cacheSavings, r.inputCost, r.outputCost, r.endpoint,
          r.statusCode, r.latencyMs, r.isStreaming,
          r.userId ?? null, JSON.stringify(r.tags),
          r.guardrailResults ? JSON.stringify(r.guardrailResults) : null,
          r.traceId ?? null, r.spanId ?? null,
          r.parentSpanId ?? null, r.sessionId ?? null, now, now,
        );
      }

      if (valueRows.length === 0) return { count: 0 };
      await pool.query(`INSERT INTO "llm_requests" (${colNames}) VALUES ${valueRows.join(', ')}`, params);
      return { count: valueRows.length };
    },

    insertRequest: async (request: LLMRequestInsert) => {
      const result = insertLLMRequestSchema.safeParse(request);
      if (!result.success) {
        throw new LLMOpsError(`Invalid request data: ${result.error.message}`);
      }
      const r = result.data;
      const now = new Date().toISOString();
      const { rows } = await pool.query(
        `INSERT INTO "llm_requests" (
          "id", "requestId", "configId", "variantId", "environmentId",
          "providerConfigId", "provider", "model", "promptTokens",
          "completionTokens", "totalTokens", "cachedTokens",
          "cacheCreationTokens", "cost", "cacheSavings", "inputCost",
          "outputCost", "endpoint", "statusCode", "latencyMs", "isStreaming",
          "userId", "tags", "guardrailResults", "traceId", "spanId",
          "parentSpanId", "sessionId", "createdAt", "updatedAt"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
        ) RETURNING *`,
        [
          randomUUID(), r.requestId, r.configId ?? null,
          r.variantId ?? null, r.environmentId ?? null,
          r.providerConfigId ?? null, r.provider, r.model,
          r.promptTokens, r.completionTokens, r.totalTokens,
          r.cachedTokens, r.cacheCreationTokens, r.cost,
          r.cacheSavings, r.inputCost, r.outputCost, r.endpoint,
          r.statusCode, r.latencyMs, r.isStreaming,
          r.userId ?? null, JSON.stringify(r.tags),
          r.guardrailResults ? JSON.stringify(r.guardrailResults) : null,
          r.traceId ?? null, r.spanId ?? null,
          r.parentSpanId ?? null, r.sessionId ?? null, now, now,
        ],
      );
      return rows[0] ?? null;
    },

    listRequests: async (params?: {
      limit?: number; offset?: number;
      configId?: string; variantId?: string; environmentId?: string;
      providerConfigId?: string; provider?: string; model?: string;
      startDate?: Date; endDate?: Date; tags?: Record<string, string[]>;
    }) => {
      const {
        limit = 100, offset = 0,
        configId, variantId, environmentId, providerConfigId,
        provider, model, startDate, endDate, tags,
      } = params ?? {};

      const conditions: string[] = ['TRUE'];
      const queryParams: unknown[] = [];
      let idx = 0;

      if (configId) { conditions.push(`"configId" = $${++idx}`); queryParams.push(configId); }
      if (variantId) { conditions.push(`"variantId" = $${++idx}`); queryParams.push(variantId); }
      if (environmentId) { conditions.push(`"environmentId" = $${++idx}`); queryParams.push(environmentId); }
      if (providerConfigId) { conditions.push(`"providerConfigId" = $${++idx}`); queryParams.push(providerConfigId); }
      if (provider) { conditions.push(`"provider" = $${++idx}`); queryParams.push(provider); }
      if (model) { conditions.push(`"model" = $${++idx}`); queryParams.push(model); }
      if (startDate) { conditions.push(`"createdAt" >= $${++idx}`); queryParams.push(startDate.toISOString()); }
      if (endDate) { conditions.push(`"createdAt" <= $${++idx}`); queryParams.push(endDate.toISOString()); }

      const tagFilter = buildTagFilters(tags, idx);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);
      idx += tagFilter.params.length;

      const where = conditions.join(' AND ');

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS "total" FROM "llm_requests" WHERE ${where}`,
        queryParams,
      );
      const total = countResult.rows[0]?.total ?? 0;

      const data = await pool.query(
        `SELECT * FROM "llm_requests" WHERE ${where} ORDER BY "createdAt" DESC LIMIT $${++idx} OFFSET $${++idx}`,
        [...queryParams, limit, offset],
      );

      return { data: data.rows, total, limit, offset };
    },

    getRequestByRequestId: async (requestId: string) => {
      const { rows } = await pool.query(
        `SELECT * FROM "llm_requests" WHERE "requestId" = $1`,
        [requestId],
      );
      return rows[0] ?? undefined;
    },

    getTotalCost: async (params: { startDate: Date; endDate: Date; configId?: string; variantId?: string; environmentId?: string; tags?: Record<string, string[]> }) => {
      const { startDate, endDate, configId, variantId, environmentId, tags } = params;

      const conditions = [
        `"createdAt" >= $1`,
        `"createdAt" <= $2`,
      ];
      const queryParams: unknown[] = [startDate.toISOString(), endDate.toISOString()];
      let idx = 2;

      if (configId) { conditions.push(`"configId" = $${++idx}`); queryParams.push(configId); }
      if (variantId) { conditions.push(`"variantId" = $${++idx}`); queryParams.push(variantId); }
      if (environmentId) { conditions.push(`"environmentId" = $${++idx}`); queryParams.push(environmentId); }

      const tagFilter = buildTagFilters(tags, idx);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');
      const { rows } = await pool.query(
        `SELECT
          COALESCE(SUM("cost"), 0)::int AS "totalCost",
          COALESCE(SUM("inputCost"), 0)::int AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0)::int AS "totalOutputCost",
          COALESCE(SUM("promptTokens"), 0)::int AS "totalPromptTokens",
          COALESCE(SUM("completionTokens"), 0)::int AS "totalCompletionTokens",
          COALESCE(SUM("totalTokens"), 0)::int AS "totalTokens",
          COALESCE(SUM("cachedTokens"), 0)::int AS "totalCachedTokens",
          COALESCE(SUM("cacheSavings"), 0)::int AS "totalCacheSavings",
          COUNT(*)::int AS "requestCount"
        FROM "llm_requests" WHERE ${where}`,
        queryParams,
      );
      return rows[0];
    },

    getCostByModel: async (params: { startDate: Date; endDate: Date }) => {
      const { rows } = await pool.query(
        `SELECT "provider", "model",
          COALESCE(SUM("cost"), 0)::int AS "totalCost",
          COALESCE(SUM("inputCost"), 0)::int AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0)::int AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0)::int AS "totalTokens",
          COUNT(*)::int AS "requestCount",
          AVG("latencyMs") AS "avgLatencyMs"
        FROM "llm_requests"
        WHERE "createdAt" >= $1 AND "createdAt" <= $2
        GROUP BY "provider", "model"
        ORDER BY SUM("cost") DESC`,
        [params.startDate.toISOString(), params.endDate.toISOString()],
      );
      return rows;
    },

    getCostByProvider: async (params: { startDate: Date; endDate: Date }) => {
      const { rows } = await pool.query(
        `SELECT "provider",
          COALESCE(SUM("cost"), 0)::int AS "totalCost",
          COALESCE(SUM("inputCost"), 0)::int AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0)::int AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0)::int AS "totalTokens",
          COUNT(*)::int AS "requestCount",
          AVG("latencyMs") AS "avgLatencyMs"
        FROM "llm_requests"
        WHERE "createdAt" >= $1 AND "createdAt" <= $2
        GROUP BY "provider"
        ORDER BY SUM("cost") DESC`,
        [params.startDate.toISOString(), params.endDate.toISOString()],
      );
      return rows;
    },

    getDailyCosts: async (params: { startDate: Date; endDate: Date }) => {
      const { rows } = await pool.query(
        `SELECT DATE("createdAt")::text AS "date",
          COALESCE(SUM("cost"), 0)::int AS "totalCost",
          COALESCE(SUM("inputCost"), 0)::int AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0)::int AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0)::int AS "totalTokens",
          COUNT(*)::int AS "requestCount"
        FROM "llm_requests"
        WHERE "createdAt" >= $1 AND "createdAt" <= $2
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC`,
        [params.startDate.toISOString(), params.endDate.toISOString()],
      );
      return rows;
    },

    getCostSummary: async (params: {
      startDate: Date; endDate: Date;
      configId?: string; variantId?: string; environmentId?: string;
      groupBy?: CostSummaryGroupBy; tags?: Record<string, string[]>;
      tagKeys?: string[];
    }) => {
      const { startDate, endDate, groupBy, configId, variantId, environmentId, tags, tagKeys } = params;

      const baseParams = [startDate.toISOString(), endDate.toISOString(), configId ?? null, variantId ?? null, environmentId ?? null];

      if (groupBy === 'tags') {
        const conditions = [
          `"createdAt" >= $1`, `"createdAt" <= $2`,
          `($3::uuid IS NULL OR "configId" = $3)`,
          `($4::uuid IS NULL OR "variantId" = $4)`,
          `($5::uuid IS NULL OR "environmentId" = $5)`,
        ];
        const queryParams: unknown[] = [...baseParams];
        let idx = 5;

        const tagFilter = buildTagFilters(tags, idx);
        conditions.push(...tagFilter.conditions);
        queryParams.push(...tagFilter.params);
        idx += tagFilter.params.length;

        if (tagKeys && tagKeys.length > 0) {
          const keyPlaceholders = tagKeys.map((_, i) => `$${idx + i + 1}`).join(', ');
          conditions.push(`t.key IN (${keyPlaceholders})`);
          queryParams.push(...tagKeys);
        }

        const where = conditions.join(' AND ');
        const { rows } = await pool.query(
          `SELECT t.key || ':' || t.value AS "groupKey",
                  COALESCE(SUM("cost"), 0)::int AS "totalCost",
                  COUNT(*)::int AS "requestCount"
           FROM "llm_requests", jsonb_each_text("tags") t
           WHERE ${where}
           GROUP BY t.key, t.value
           ORDER BY SUM("cost") DESC`,
          queryParams,
        );
        return rows;
      }

      const sqlMap: Record<string, string> = {
        day: `SELECT DATE("createdAt")::text AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount", COALESCE(SUM("totalTokens"),0)::int AS "totalTokens" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5) GROUP BY DATE("createdAt") ORDER BY DATE("createdAt") ASC`,
        hour: `SELECT DATE_TRUNC('hour',"createdAt")::text AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount", COALESCE(SUM("totalTokens"),0)::int AS "totalTokens" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5) GROUP BY DATE_TRUNC('hour',"createdAt") ORDER BY DATE_TRUNC('hour',"createdAt") ASC`,
        model: `SELECT "provider"||'/'||"model" AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5) GROUP BY "provider","model" ORDER BY SUM("cost") DESC`,
        provider: `SELECT "provider" AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5) GROUP BY "provider" ORDER BY SUM("cost") DESC`,
        endpoint: `SELECT COALESCE("endpoint",'unknown') AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5) GROUP BY "endpoint" ORDER BY SUM("cost") DESC`,
      };

      const totalSql = `SELECT 'total' AS "groupKey", COALESCE(SUM("cost"),0)::int AS "totalCost", COUNT(*)::int AS "requestCount" FROM "llm_requests" WHERE "createdAt">=$1 AND "createdAt"<=$2 AND ($3::uuid IS NULL OR "configId"=$3) AND ($4::uuid IS NULL OR "variantId"=$4) AND ($5::uuid IS NULL OR "environmentId"=$5)`;

      const sql = groupBy ? (sqlMap[groupBy] ?? totalSql) : totalSql;
      const { rows } = await pool.query(sql, baseParams);
      return rows;
    },

    getRequestStats: async (params: { startDate: Date; endDate: Date; configId?: string; variantId?: string; environmentId?: string; tags?: Record<string, string[]> }) => {
      const { startDate, endDate, configId, variantId, environmentId, tags } = params;

      const conditions = [`"createdAt" >= $1`, `"createdAt" <= $2`];
      const queryParams: unknown[] = [startDate.toISOString(), endDate.toISOString()];
      let idx = 2;

      if (configId) { conditions.push(`"configId" = $${++idx}`); queryParams.push(configId); }
      if (variantId) { conditions.push(`"variantId" = $${++idx}`); queryParams.push(variantId); }
      if (environmentId) { conditions.push(`"environmentId" = $${++idx}`); queryParams.push(environmentId); }

      const tagFilter = buildTagFilters(tags, idx);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');
      const { rows } = await pool.query(
        `SELECT
          COUNT(*)::int AS "totalRequests",
          COUNT(CASE WHEN "statusCode">=200 AND "statusCode"<300 THEN 1 END)::int AS "successfulRequests",
          COUNT(CASE WHEN "statusCode">=400 THEN 1 END)::int AS "failedRequests",
          COUNT(CASE WHEN "isStreaming"=true THEN 1 END)::int AS "streamingRequests",
          AVG("latencyMs") AS "avgLatencyMs",
          MAX("latencyMs")::int AS "maxLatencyMs",
          MIN("latencyMs")::int AS "minLatencyMs"
        FROM "llm_requests" WHERE ${where}`,
        queryParams,
      );
      return rows[0];
    },

    getDistinctTags: async () => {
      const { rows } = await pool.query(
        `SELECT DISTINCT key, value
         FROM "llm_requests", jsonb_each_text("tags") AS t(key, value)
         WHERE "tags" != '{}'::jsonb
         ORDER BY key, value`,
      );
      return rows;
    },
  };
}

// ─── Traces store ───────────────────────────────────────────────────────────

function createTracesStore(pool: any) {
  return {
    upsertTrace: async (data: TraceUpsert) => {
      const result = upsertTraceSchema.safeParse(data);
      if (!result.success) {
        throw new LLMOpsError(`Invalid trace data: ${result.error.message}`);
      }
      const trace = result.data;
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO "traces" (
          "id","traceId","name","sessionId","userId","status",
          "startTime","endTime","durationMs","spanCount",
          "totalInputTokens","totalOutputTokens","totalTokens","totalCost",
          "tags","metadata","createdAt","updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$17)
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
            GREATEST(COALESCE("traces"."endTime",EXCLUDED."endTime"),COALESCE(EXCLUDED."endTime","traces"."endTime")) -
            LEAST("traces"."startTime", EXCLUDED."startTime")
          ))::integer * 1000,
          "spanCount" = "traces"."spanCount" + EXCLUDED."spanCount",
          "totalInputTokens" = "traces"."totalInputTokens" + EXCLUDED."totalInputTokens",
          "totalOutputTokens" = "traces"."totalOutputTokens" + EXCLUDED."totalOutputTokens",
          "totalTokens" = "traces"."totalTokens" + EXCLUDED."totalTokens",
          "totalCost" = "traces"."totalCost" + EXCLUDED."totalCost",
          "tags" = "traces"."tags" || EXCLUDED."tags",
          "metadata" = "traces"."metadata" || EXCLUDED."metadata",
          "updatedAt" = $17`,
        [
          randomUUID(), trace.traceId, trace.name ?? null,
          trace.sessionId ?? null, trace.userId ?? null, trace.status,
          trace.startTime.toISOString(), trace.endTime?.toISOString() ?? null,
          trace.durationMs ?? null, trace.spanCount,
          trace.totalInputTokens, trace.totalOutputTokens,
          trace.totalTokens, trace.totalCost,
          JSON.stringify(trace.tags), JSON.stringify(trace.metadata), now,
        ],
      );
    },

    batchInsertSpans: async (spans: SpanInsert[]) => {
      if (spans.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const columns = [
        'id', 'traceId', 'spanId', 'parentSpanId', 'name', 'kind',
        'status', 'statusMessage', 'startTime', 'endTime', 'durationMs',
        'provider', 'model', 'promptTokens', 'completionTokens',
        'totalTokens', 'cost', 'configId', 'variantId', 'environmentId',
        'providerConfigId', 'requestId', 'source', 'input', 'output',
        'attributes', 'createdAt', 'updatedAt',
      ];
      const colNames = columns.map((c) => `"${c}"`).join(', ');
      const params: unknown[] = [];
      const valueRows: string[] = [];

      for (const span of spans) {
        const result = insertSpanSchema.safeParse(span);
        if (!result.success) {
          logger.warn(`[batchInsertSpans] Skipping invalid span ${span.spanId}: ${result.error.message}`);
          continue;
        }
        const s = result.data;
        const offset = params.length;
        const placeholders = columns.map((_, i) => `$${offset + i + 1}`).join(', ');
        valueRows.push(`(${placeholders})`);
        params.push(
          randomUUID(), s.traceId, s.spanId,
          s.parentSpanId ?? null, s.name, s.kind,
          s.status, s.statusMessage ?? null,
          s.startTime.toISOString(), s.endTime?.toISOString() ?? null,
          s.durationMs ?? null, s.provider ?? null,
          s.model ?? null, s.promptTokens,
          s.completionTokens, s.totalTokens,
          s.cost, s.configId ?? null,
          s.variantId ?? null, s.environmentId ?? null,
          s.providerConfigId ?? null, s.requestId ?? null,
          s.source,
          s.input != null ? JSON.stringify(s.input) : null,
          s.output != null ? JSON.stringify(s.output) : null,
          JSON.stringify(s.attributes), now, now,
        );
      }

      if (valueRows.length === 0) return { count: 0 };
      await pool.query(
        `INSERT INTO "spans" (${colNames}) VALUES ${valueRows.join(', ')} ON CONFLICT ("spanId") DO NOTHING`,
        params,
      );
      return { count: valueRows.length };
    },

    batchInsertSpanEvents: async (events: SpanEventInsert[]) => {
      if (events.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const columns = ['id', 'traceId', 'spanId', 'name', 'timestamp', 'attributes', 'createdAt'];
      const colNames = columns.map((c) => `"${c}"`).join(', ');
      const params: unknown[] = [];
      const valueRows: string[] = [];

      for (const event of events) {
        const result = insertSpanEventSchema.safeParse(event);
        if (!result.success) {
          logger.warn(`[batchInsertSpanEvents] Skipping invalid event: ${result.error.message}`);
          continue;
        }
        const e = result.data;
        const offset = params.length;
        const placeholders = columns.map((_, i) => `$${offset + i + 1}`).join(', ');
        valueRows.push(`(${placeholders})`);
        params.push(
          randomUUID(), e.traceId, e.spanId,
          e.name, e.timestamp.toISOString(),
          JSON.stringify(e.attributes), now,
        );
      }

      if (valueRows.length === 0) return { count: 0 };
      await pool.query(
        `INSERT INTO "span_events" (${colNames}) VALUES ${valueRows.join(', ')}`,
        params,
      );
      return { count: valueRows.length };
    },

    listTraces: async (params?: {
      limit?: number; offset?: number;
      sessionId?: string; userId?: string; status?: string;
      name?: string; startDate?: Date; endDate?: Date;
      tags?: Record<string, string[]>;
    }) => {
      const { limit = 50, offset = 0, sessionId, userId, status, name, startDate, endDate, tags } = params ?? {};

      const conditions: string[] = ['TRUE'];
      const queryParams: unknown[] = [];
      let idx = 0;

      if (sessionId) { conditions.push(`"sessionId" = $${++idx}`); queryParams.push(sessionId); }
      if (userId) { conditions.push(`"userId" = $${++idx}`); queryParams.push(userId); }
      if (status) { conditions.push(`"status" = $${++idx}`); queryParams.push(status); }
      if (name) { conditions.push(`"name" ILIKE $${++idx}`); queryParams.push(`%${name}%`); }
      if (startDate) { conditions.push(`"startTime" >= $${++idx}`); queryParams.push(startDate.toISOString()); }
      if (endDate) { conditions.push(`"startTime" <= $${++idx}`); queryParams.push(endDate.toISOString()); }

      const tagFilter = buildTagFilters(tags, idx);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);
      idx += tagFilter.params.length;

      const where = conditions.join(' AND ');

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS "total" FROM "traces" WHERE ${where}`,
        queryParams,
      );
      const total = countResult.rows[0]?.total ?? 0;

      const data = await pool.query(
        `SELECT * FROM "traces" WHERE ${where} ORDER BY "startTime" DESC LIMIT $${++idx} OFFSET $${++idx}`,
        [...queryParams, limit, offset],
      );

      return { data: data.rows, total, limit, offset };
    },

    getTraceWithSpans: async (traceId: string) => {
      const traceResult = await pool.query(`SELECT * FROM "traces" WHERE "traceId" = $1`, [traceId]);
      const trace = traceResult.rows[0];
      if (!trace) return undefined;

      const [spanResult, eventResult] = await Promise.all([
        pool.query(`SELECT * FROM "spans" WHERE "traceId" = $1 ORDER BY "startTime" ASC`, [traceId]),
        pool.query(`SELECT * FROM "span_events" WHERE "traceId" = $1 ORDER BY "timestamp" ASC`, [traceId]),
      ]);

      return { trace, spans: spanResult.rows, events: eventResult.rows };
    },

    getTraceStats: async (params: { startDate: Date; endDate: Date; sessionId?: string; userId?: string }) => {
      const { rows } = await pool.query(
        `SELECT
          COUNT(*)::int AS "totalTraces",
          COALESCE(AVG("durationMs"), 0) AS "avgDurationMs",
          COUNT(CASE WHEN "status" = 'error' THEN 1 END)::int AS "errorCount",
          COALESCE(SUM("totalCost"), 0)::int AS "totalCost",
          COALESCE(SUM("totalTokens"), 0)::int AS "totalTokens",
          COALESCE(SUM("spanCount"), 0)::int AS "totalSpans"
        FROM "traces"
        WHERE "startTime" >= $1 AND "startTime" <= $2
          AND ($3::varchar IS NULL OR "sessionId" = $3)
          AND ($4::varchar IS NULL OR "userId" = $4)`,
        [params.startDate.toISOString(), params.endDate.toISOString(), params.sessionId ?? null, params.userId ?? null],
      );
      return rows[0];
    },
  };
}

// ─── PgStore ────────────────────────────────────────────────────────────────

export type PgStore = ReturnType<typeof createLLMRequestsStore> &
  ReturnType<typeof createTracesStore> & {
    _pool: unknown;
    _schema: string;
  };

const pgStoreOptionsSchema = z.object({
  schema: z.string().default('llmops'),
});

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
    const pg = require('pg');
    pool = new pg.Pool({ connectionString });
  } catch {
    throw new Error(
      'pgStore requires the "pg" package. Install it with: pnpm add pg',
    );
  }

  // Set search_path for all connections
  pool.on('connect', (client: any) => {
    client.query(`SET search_path TO "${schema}"`);
  });

  logger.debug(`pgStore: initialized with schema "${schema}"`);

  return {
    ...createLLMRequestsStore(pool),
    ...createTracesStore(pool),
    _pool: pool,
    _schema: schema,
  };
}
