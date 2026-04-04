import { randomUUID } from 'node:crypto';
import type { D1Database } from './types';
import type { TelemetryStore } from '../../telemetry/interface';
import type {
  LLMRequestInsert,
  TraceUpsert,
  SpanInsert,
  SpanEventInsert,
  CostSummaryGroupBy,
} from '../../telemetry/pg-store';

// ─── Tag filter helper (D1 uses ? placeholders) ────────────────────────────

function buildTagFilters(
  tags: Record<string, string[]> | undefined,
): { conditions: string[]; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (!tags) return { conditions, params };

  for (const [key, values] of Object.entries(tags)) {
    if (values.length === 0) continue;
    if (values.length === 1) {
      conditions.push(`json_extract("tags", '$.' || ?) = ?`);
      params.push(key, values[0]);
    } else {
      const placeholders = values.map(() => '?').join(', ');
      conditions.push(`json_extract("tags", '$.' || ?) IN (${placeholders})`);
      params.push(key, ...values);
    }
  }
  return { conditions, params };
}

// D1 batch limit
const D1_BATCH_LIMIT = 100;

// ─── LLM Requests store ────────────────────────────────────────────────────

function createD1LLMRequestsStore(db: D1Database) {
  return {
    batchInsertRequests: async (requests: LLMRequestInsert[]) => {
      if (requests.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const stmts = requests.map((req) =>
        db.prepare(`
          INSERT INTO "llm_requests" (
            "id","requestId","configId","variantId","environmentId",
            "providerConfigId","provider","model","promptTokens",
            "completionTokens","totalTokens","cachedTokens",
            "cacheCreationTokens","cost","cacheSavings","inputCost",
            "outputCost","endpoint","statusCode","latencyMs","isStreaming",
            "userId","tags","guardrailResults","traceId","spanId",
            "parentSpanId","sessionId","createdAt","updatedAt"
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          randomUUID(), req.requestId, req.configId ?? null,
          req.variantId ?? null, req.environmentId ?? null,
          req.providerConfigId ?? null, req.provider, req.model,
          req.promptTokens ?? 0, req.completionTokens ?? 0, req.totalTokens ?? 0,
          req.cachedTokens ?? 0, req.cacheCreationTokens ?? 0, req.cost ?? 0,
          req.cacheSavings ?? 0, req.inputCost ?? 0, req.outputCost ?? 0,
          req.endpoint, req.statusCode, req.latencyMs ?? 0,
          req.isStreaming ? 1 : 0,
          req.userId ?? null, JSON.stringify(req.tags ?? {}),
          req.guardrailResults ? JSON.stringify(req.guardrailResults) : null,
          req.traceId ?? null, req.spanId ?? null,
          req.parentSpanId ?? null, req.sessionId ?? null, now, now,
        ),
      );

      // Chunk into batches of D1_BATCH_LIMIT
      for (let i = 0; i < stmts.length; i += D1_BATCH_LIMIT) {
        await db.batch(stmts.slice(i, i + D1_BATCH_LIMIT));
      }
      return { count: requests.length };
    },

    insertRequest: async (req: LLMRequestInsert) => {
      const now = new Date().toISOString();
      return db.prepare(`
        INSERT INTO "llm_requests" (
          "id","requestId","configId","variantId","environmentId",
          "providerConfigId","provider","model","promptTokens",
          "completionTokens","totalTokens","cachedTokens",
          "cacheCreationTokens","cost","cacheSavings","inputCost",
          "outputCost","endpoint","statusCode","latencyMs","isStreaming",
          "userId","tags","guardrailResults","traceId","spanId",
          "parentSpanId","sessionId","createdAt","updatedAt"
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        RETURNING *
      `).bind(
        randomUUID(), req.requestId, req.configId ?? null,
        req.variantId ?? null, req.environmentId ?? null,
        req.providerConfigId ?? null, req.provider, req.model,
        req.promptTokens ?? 0, req.completionTokens ?? 0, req.totalTokens ?? 0,
        req.cachedTokens ?? 0, req.cacheCreationTokens ?? 0, req.cost ?? 0,
        req.cacheSavings ?? 0, req.inputCost ?? 0, req.outputCost ?? 0,
        req.endpoint, req.statusCode, req.latencyMs ?? 0,
        req.isStreaming ? 1 : 0,
        req.userId ?? null, JSON.stringify(req.tags ?? {}),
        req.guardrailResults ? JSON.stringify(req.guardrailResults) : null,
        req.traceId ?? null, req.spanId ?? null,
        req.parentSpanId ?? null, req.sessionId ?? null, now, now,
      ).first();
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

      const conditions: string[] = ['1=1'];
      const queryParams: unknown[] = [];

      if (configId) { conditions.push(`"configId" = ?`); queryParams.push(configId); }
      if (variantId) { conditions.push(`"variantId" = ?`); queryParams.push(variantId); }
      if (environmentId) { conditions.push(`"environmentId" = ?`); queryParams.push(environmentId); }
      if (providerConfigId) { conditions.push(`"providerConfigId" = ?`); queryParams.push(providerConfigId); }
      if (provider) { conditions.push(`"provider" = ?`); queryParams.push(provider); }
      if (model) { conditions.push(`"model" = ?`); queryParams.push(model); }
      if (startDate) { conditions.push(`"createdAt" >= ?`); queryParams.push(startDate.toISOString()); }
      if (endDate) { conditions.push(`"createdAt" <= ?`); queryParams.push(endDate.toISOString()); }

      const tagFilter = buildTagFilters(tags);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');

      const countResult = await db.prepare(
        `SELECT COUNT(*) AS "total" FROM "llm_requests" WHERE ${where}`,
      ).bind(...queryParams).first<{ total: number }>();
      const total = countResult?.total ?? 0;

      const { results: data } = await db.prepare(
        `SELECT * FROM "llm_requests" WHERE ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`,
      ).bind(...queryParams, limit, offset).all();

      return { data, total, limit, offset };
    },

    getRequestByRequestId: async (requestId: string) => {
      return db.prepare(
        `SELECT * FROM "llm_requests" WHERE "requestId" = ?`,
      ).bind(requestId).first();
    },

    getTotalCost: async (params: {
      startDate: Date; endDate: Date;
      configId?: string; variantId?: string; environmentId?: string;
      tags?: Record<string, string[]>;
    }) => {
      const conditions = [`"createdAt" >= ?`, `"createdAt" <= ?`];
      const queryParams: unknown[] = [params.startDate.toISOString(), params.endDate.toISOString()];

      if (params.configId) { conditions.push(`"configId" = ?`); queryParams.push(params.configId); }
      if (params.variantId) { conditions.push(`"variantId" = ?`); queryParams.push(params.variantId); }
      if (params.environmentId) { conditions.push(`"environmentId" = ?`); queryParams.push(params.environmentId); }

      const tagFilter = buildTagFilters(params.tags);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');
      return db.prepare(`
        SELECT
          COALESCE(SUM("cost"), 0) AS "totalCost",
          COALESCE(SUM("inputCost"), 0) AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0) AS "totalOutputCost",
          COALESCE(SUM("promptTokens"), 0) AS "totalPromptTokens",
          COALESCE(SUM("completionTokens"), 0) AS "totalCompletionTokens",
          COALESCE(SUM("totalTokens"), 0) AS "totalTokens",
          COALESCE(SUM("cachedTokens"), 0) AS "totalCachedTokens",
          COALESCE(SUM("cacheSavings"), 0) AS "totalCacheSavings",
          COUNT(*) AS "requestCount"
        FROM "llm_requests" WHERE ${where}
      `).bind(...queryParams).first();
    },

    getCostByModel: async (params: { startDate: Date; endDate: Date }) => {
      const { results } = await db.prepare(`
        SELECT "provider", "model",
          COALESCE(SUM("cost"), 0) AS "totalCost",
          COALESCE(SUM("inputCost"), 0) AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0) AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0) AS "totalTokens",
          COUNT(*) AS "requestCount",
          AVG("latencyMs") AS "avgLatencyMs"
        FROM "llm_requests"
        WHERE "createdAt" >= ? AND "createdAt" <= ?
        GROUP BY "provider", "model"
        ORDER BY SUM("cost") DESC
      `).bind(params.startDate.toISOString(), params.endDate.toISOString()).all();
      return results;
    },

    getCostByProvider: async (params: { startDate: Date; endDate: Date }) => {
      const { results } = await db.prepare(`
        SELECT "provider",
          COALESCE(SUM("cost"), 0) AS "totalCost",
          COALESCE(SUM("inputCost"), 0) AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0) AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0) AS "totalTokens",
          COUNT(*) AS "requestCount",
          AVG("latencyMs") AS "avgLatencyMs"
        FROM "llm_requests"
        WHERE "createdAt" >= ? AND "createdAt" <= ?
        GROUP BY "provider"
        ORDER BY SUM("cost") DESC
      `).bind(params.startDate.toISOString(), params.endDate.toISOString()).all();
      return results;
    },

    getDailyCosts: async (params: { startDate: Date; endDate: Date }) => {
      const { results } = await db.prepare(`
        SELECT date("createdAt") AS "date",
          COALESCE(SUM("cost"), 0) AS "totalCost",
          COALESCE(SUM("inputCost"), 0) AS "totalInputCost",
          COALESCE(SUM("outputCost"), 0) AS "totalOutputCost",
          COALESCE(SUM("totalTokens"), 0) AS "totalTokens",
          COUNT(*) AS "requestCount"
        FROM "llm_requests"
        WHERE "createdAt" >= ? AND "createdAt" <= ?
        GROUP BY date("createdAt")
        ORDER BY date("createdAt") ASC
      `).bind(params.startDate.toISOString(), params.endDate.toISOString()).all();
      return results;
    },

    getCostSummary: async (params: {
      startDate: Date; endDate: Date;
      configId?: string; variantId?: string; environmentId?: string;
      groupBy?: CostSummaryGroupBy; tags?: Record<string, string[]>;
      tagKeys?: string[];
    }) => {
      const { startDate, endDate, groupBy, configId, variantId, environmentId, tags, tagKeys } = params;

      const conditions = [`"createdAt" >= ?`, `"createdAt" <= ?`];
      const queryParams: unknown[] = [startDate.toISOString(), endDate.toISOString()];

      if (configId) { conditions.push(`"configId" = ?`); queryParams.push(configId); }
      if (variantId) { conditions.push(`"variantId" = ?`); queryParams.push(variantId); }
      if (environmentId) { conditions.push(`"environmentId" = ?`); queryParams.push(environmentId); }

      const tagFilter = buildTagFilters(tags);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');

      if (groupBy === 'tags') {
        const tagConditions = [...conditions];
        const tagParams = [...queryParams];
        if (tagKeys && tagKeys.length > 0) {
          tagConditions.push(`json_each.key IN (${tagKeys.map(() => '?').join(',')})`);
          tagParams.push(...tagKeys);
        }
        const tagWhere = tagConditions.join(' AND ');
        const { results } = await db.prepare(`
          SELECT json_each.key || ':' || json_each.value AS "groupKey",
                 COALESCE(SUM("cost"), 0) AS "totalCost",
                 COUNT(*) AS "requestCount"
          FROM "llm_requests", json_each("tags")
          WHERE ${tagWhere}
          GROUP BY json_each.key, json_each.value
          ORDER BY SUM("cost") DESC
        `).bind(...tagParams).all();
        return results;
      }

      const sqlMap: Record<string, string> = {
        day: `SELECT date("createdAt") AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount", COALESCE(SUM("totalTokens"),0) AS "totalTokens" FROM "llm_requests" WHERE ${where} GROUP BY date("createdAt") ORDER BY date("createdAt") ASC`,
        hour: `SELECT strftime('%Y-%m-%d %H:00:00',"createdAt") AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount", COALESCE(SUM("totalTokens"),0) AS "totalTokens" FROM "llm_requests" WHERE ${where} GROUP BY strftime('%Y-%m-%d %H:00:00',"createdAt") ORDER BY strftime('%Y-%m-%d %H:00:00',"createdAt") ASC`,
        model: `SELECT "provider"||'/'||"model" AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount" FROM "llm_requests" WHERE ${where} GROUP BY "provider","model" ORDER BY SUM("cost") DESC`,
        provider: `SELECT "provider" AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount" FROM "llm_requests" WHERE ${where} GROUP BY "provider" ORDER BY SUM("cost") DESC`,
        endpoint: `SELECT COALESCE("endpoint",'unknown') AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount" FROM "llm_requests" WHERE ${where} GROUP BY "endpoint" ORDER BY SUM("cost") DESC`,
      };

      const totalSql = `SELECT 'total' AS "groupKey", COALESCE(SUM("cost"),0) AS "totalCost", COUNT(*) AS "requestCount" FROM "llm_requests" WHERE ${where}`;
      const sql = groupBy ? (sqlMap[groupBy] ?? totalSql) : totalSql;
      const { results } = await db.prepare(sql).bind(...queryParams).all();
      return results;
    },

    getRequestStats: async (params: {
      startDate: Date; endDate: Date;
      configId?: string; variantId?: string; environmentId?: string;
      tags?: Record<string, string[]>;
    }) => {
      const conditions = [`"createdAt" >= ?`, `"createdAt" <= ?`];
      const queryParams: unknown[] = [params.startDate.toISOString(), params.endDate.toISOString()];

      if (params.configId) { conditions.push(`"configId" = ?`); queryParams.push(params.configId); }
      if (params.variantId) { conditions.push(`"variantId" = ?`); queryParams.push(params.variantId); }
      if (params.environmentId) { conditions.push(`"environmentId" = ?`); queryParams.push(params.environmentId); }

      const tagFilter = buildTagFilters(params.tags);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');
      return db.prepare(`
        SELECT
          COUNT(*) AS "totalRequests",
          COUNT(CASE WHEN "statusCode">=200 AND "statusCode"<300 THEN 1 END) AS "successfulRequests",
          COUNT(CASE WHEN "statusCode">=400 THEN 1 END) AS "failedRequests",
          COUNT(CASE WHEN "isStreaming"=1 THEN 1 END) AS "streamingRequests",
          AVG("latencyMs") AS "avgLatencyMs",
          MAX("latencyMs") AS "maxLatencyMs",
          MIN("latencyMs") AS "minLatencyMs"
        FROM "llm_requests" WHERE ${where}
      `).bind(...queryParams).first();
    },

    getDistinctTags: async () => {
      const { results } = await db.prepare(`
        SELECT DISTINCT json_each.key AS key, json_each.value AS value
        FROM "llm_requests", json_each("tags")
        WHERE "tags" != '{}'
        ORDER BY json_each.key, json_each.value
      `).all();
      return results;
    },
  };
}

// ─── Traces store ───────────────────────────────────────────────────────────

function createD1TracesStore(db: D1Database) {
  return {
    upsertTrace: async (data: TraceUpsert): Promise<void> => {
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO "traces" (
          "id","traceId","name","sessionId","userId","status",
          "startTime","endTime","durationMs","spanCount",
          "totalInputTokens","totalOutputTokens","totalTokens","totalCost",
          "tags","metadata","createdAt","updatedAt"
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT ("traceId") DO UPDATE SET
          "name" = COALESCE(EXCLUDED."name", "traces"."name"),
          "sessionId" = COALESCE(EXCLUDED."sessionId", "traces"."sessionId"),
          "userId" = COALESCE(EXCLUDED."userId", "traces"."userId"),
          "status" = CASE
            WHEN EXCLUDED."status" = 'error' THEN 'error'
            WHEN EXCLUDED."status" = 'ok' AND "traces"."status" != 'error' THEN 'ok'
            ELSE "traces"."status"
          END,
          "startTime" = MIN("traces"."startTime", EXCLUDED."startTime"),
          "endTime" = MAX(
            COALESCE("traces"."endTime", EXCLUDED."endTime"),
            COALESCE(EXCLUDED."endTime", "traces"."endTime")
          ),
          "durationMs" = CAST(
            (julianday(MAX(
              COALESCE("traces"."endTime", EXCLUDED."endTime"),
              COALESCE(EXCLUDED."endTime", "traces"."endTime")
            )) - julianday(MIN("traces"."startTime", EXCLUDED."startTime")))
            * 86400000 AS INTEGER
          ),
          "spanCount" = "traces"."spanCount" + EXCLUDED."spanCount",
          "totalInputTokens" = "traces"."totalInputTokens" + EXCLUDED."totalInputTokens",
          "totalOutputTokens" = "traces"."totalOutputTokens" + EXCLUDED."totalOutputTokens",
          "totalTokens" = "traces"."totalTokens" + EXCLUDED."totalTokens",
          "totalCost" = "traces"."totalCost" + EXCLUDED."totalCost",
          "tags" = json_patch("traces"."tags", EXCLUDED."tags"),
          "metadata" = json_patch("traces"."metadata", EXCLUDED."metadata"),
          "updatedAt" = ?
      `).bind(
        randomUUID(), data.traceId, data.name ?? null,
        data.sessionId ?? null, data.userId ?? null, data.status ?? 'unset',
        data.startTime.toISOString(), data.endTime?.toISOString() ?? null,
        data.durationMs ?? null, data.spanCount ?? 1,
        data.totalInputTokens ?? 0, data.totalOutputTokens ?? 0,
        data.totalTokens ?? 0, data.totalCost ?? 0,
        JSON.stringify(data.tags ?? {}), JSON.stringify(data.metadata ?? {}),
        now, now,
        now, // for the updatedAt in ON CONFLICT
      ).run();
    },

    batchInsertSpans: async (spans: SpanInsert[]) => {
      if (spans.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const stmts = spans.map((s) =>
        db.prepare(`
          INSERT OR IGNORE INTO "spans" (
            "id","traceId","spanId","parentSpanId","name","kind",
            "status","statusMessage","startTime","endTime","durationMs",
            "provider","model","promptTokens","completionTokens",
            "totalTokens","cost","configId","variantId","environmentId",
            "providerConfigId","requestId","source","input","output",
            "attributes","createdAt","updatedAt"
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          randomUUID(), s.traceId, s.spanId,
          s.parentSpanId ?? null, s.name, s.kind ?? 1,
          s.status ?? 0, s.statusMessage ?? null,
          s.startTime.toISOString(), s.endTime?.toISOString() ?? null,
          s.durationMs ?? null, s.provider ?? null,
          s.model ?? null, s.promptTokens ?? 0,
          s.completionTokens ?? 0, s.totalTokens ?? 0,
          s.cost ?? 0, s.configId ?? null,
          s.variantId ?? null, s.environmentId ?? null,
          s.providerConfigId ?? null, s.requestId ?? null,
          s.source ?? 'gateway',
          s.input != null ? JSON.stringify(s.input) : null,
          s.output != null ? JSON.stringify(s.output) : null,
          JSON.stringify(s.attributes ?? {}), now, now,
        ),
      );

      for (let i = 0; i < stmts.length; i += D1_BATCH_LIMIT) {
        await db.batch(stmts.slice(i, i + D1_BATCH_LIMIT));
      }
      return { count: spans.length };
    },

    batchInsertSpanEvents: async (events: SpanEventInsert[]) => {
      if (events.length === 0) return { count: 0 };

      const now = new Date().toISOString();
      const stmts = events.map((e) =>
        db.prepare(`
          INSERT INTO "span_events" (
            "id","traceId","spanId","name","timestamp","attributes","createdAt"
          ) VALUES (?,?,?,?,?,?,?)
        `).bind(
          randomUUID(), e.traceId, e.spanId,
          e.name, e.timestamp.toISOString(),
          JSON.stringify(e.attributes ?? {}), now,
        ),
      );

      for (let i = 0; i < stmts.length; i += D1_BATCH_LIMIT) {
        await db.batch(stmts.slice(i, i + D1_BATCH_LIMIT));
      }
      return { count: events.length };
    },

    listTraces: async (params?: {
      limit?: number; offset?: number;
      sessionId?: string; userId?: string; status?: string;
      name?: string; startDate?: Date; endDate?: Date;
      tags?: Record<string, string[]>;
    }) => {
      const { limit = 50, offset = 0, sessionId, userId, status, name, startDate, endDate, tags } = params ?? {};

      const conditions: string[] = ['1=1'];
      const queryParams: unknown[] = [];

      if (sessionId) { conditions.push(`"sessionId" = ?`); queryParams.push(sessionId); }
      if (userId) { conditions.push(`"userId" = ?`); queryParams.push(userId); }
      if (status) { conditions.push(`"status" = ?`); queryParams.push(status); }
      if (name) { conditions.push(`"name" LIKE ?`); queryParams.push(`%${name}%`); }
      if (startDate) { conditions.push(`"startTime" >= ?`); queryParams.push(startDate.toISOString()); }
      if (endDate) { conditions.push(`"startTime" <= ?`); queryParams.push(endDate.toISOString()); }

      const tagFilter = buildTagFilters(tags);
      conditions.push(...tagFilter.conditions);
      queryParams.push(...tagFilter.params);

      const where = conditions.join(' AND ');

      const countResult = await db.prepare(
        `SELECT COUNT(*) AS "total" FROM "traces" WHERE ${where}`,
      ).bind(...queryParams).first<{ total: number }>();
      const total = countResult?.total ?? 0;

      const { results: data } = await db.prepare(
        `SELECT * FROM "traces" WHERE ${where} ORDER BY "startTime" DESC LIMIT ? OFFSET ?`,
      ).bind(...queryParams, limit, offset).all();

      return { data, total, limit, offset };
    },

    getTraceWithSpans: async (traceId: string) => {
      const trace = await db.prepare(
        `SELECT * FROM "traces" WHERE "traceId" = ?`,
      ).bind(traceId).first();

      if (!trace) return undefined;

      const [spanResult, eventResult] = await db.batch([
        db.prepare(`SELECT * FROM "spans" WHERE "traceId" = ? ORDER BY "startTime" ASC`).bind(traceId),
        db.prepare(`SELECT * FROM "span_events" WHERE "traceId" = ? ORDER BY "timestamp" ASC`).bind(traceId),
      ]);

      return {
        trace,
        spans: (spanResult as any).results ?? [],
        events: (eventResult as any).results ?? [],
      };
    },

    getTraceStats: async (params: { startDate: Date; endDate: Date; sessionId?: string; userId?: string }) => {
      const conditions = [`"startTime" >= ?`, `"startTime" <= ?`];
      const queryParams: unknown[] = [params.startDate.toISOString(), params.endDate.toISOString()];

      if (params.sessionId) { conditions.push(`"sessionId" = ?`); queryParams.push(params.sessionId); }
      if (params.userId) { conditions.push(`"userId" = ?`); queryParams.push(params.userId); }

      const where = conditions.join(' AND ');
      return db.prepare(`
        SELECT
          COUNT(*) AS "totalTraces",
          COALESCE(AVG("durationMs"), 0) AS "avgDurationMs",
          COUNT(CASE WHEN "status" = 'error' THEN 1 END) AS "errorCount",
          COALESCE(SUM("totalCost"), 0) AS "totalCost",
          COALESCE(SUM("totalTokens"), 0) AS "totalTokens",
          COALESCE(SUM("spanCount"), 0) AS "totalSpans"
        FROM "traces" WHERE ${where}
      `).bind(...queryParams).first();
    },
  };
}

// ─── D1Store ────────────────────────────────────────────────────────────────

export type D1Store = TelemetryStore & {
  _db: D1Database;
};

/**
 * Create a Cloudflare D1-backed telemetry store.
 *
 * Usage:
 * ```ts
 * import { d1Store } from '@llmops/sdk/store/d1'
 *
 * export default {
 *   async fetch(request, env) {
 *     const ops = llmops({
 *       telemetry: d1Store(env.DB),
 *     })
 *   }
 * }
 * ```
 */
export function createD1Store(db: D1Database): D1Store {
  return {
    ...createD1LLMRequestsStore(db),
    ...createD1TracesStore(db),
    _db: db,
  };
}
