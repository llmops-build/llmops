import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const col = (name: string) => sql.ref(name);

/**
 * Schema for upserting a trace
 */
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

/**
 * Schema for inserting spans
 */
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

/**
 * Schema for inserting span events
 */
const insertSpanEventSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  name: z.string(),
  timestamp: z.date(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type SpanEventInsert = z.infer<typeof insertSpanEventSchema>;

/**
 * Schema for listing traces
 */
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

/**
 * Schema for trace stats query
 */
const traceStatsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

export const createTracesDataLayer = (db: Kysely<Database>) => {
  return {
    /**
     * Upsert a trace — insert or update aggregates on conflict
     */
    upsertTrace: async (data: TraceUpsert) => {
      const result = await upsertTraceSchema.safeParseAsync(data);
      if (!result.success) {
        throw new LLMOpsError(
          `Invalid trace data: ${result.error.message}`
        );
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

    /**
     * Batch insert spans
     */
    batchInsertSpans: async (spans: SpanInsert[]) => {
      if (spans.length === 0) return { count: 0 };

      const validatedSpans = await Promise.all(
        spans.map(async (span) => {
          const result = await insertSpanSchema.safeParseAsync(span);
          if (!result.success) {
            throw new LLMOpsError(
              `Invalid span data: ${result.error.message}`
            );
          }
          return result.data;
        })
      );

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

    /**
     * Batch insert span events
     */
    batchInsertSpanEvents: async (events: SpanEventInsert[]) => {
      if (events.length === 0) return { count: 0 };

      const validatedEvents = await Promise.all(
        events.map(async (event) => {
          const result = await insertSpanEventSchema.safeParseAsync(event);
          if (!result.success) {
            throw new LLMOpsError(
              `Invalid span event data: ${result.error.message}`
            );
          }
          return result.data;
        })
      );

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

    /**
     * List traces with filtering and pagination
     */
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

      if (sessionId) {
        baseQuery = baseQuery.where('sessionId', '=', sessionId);
      }
      if (userId) {
        baseQuery = baseQuery.where('userId', '=', userId);
      }
      if (status) {
        baseQuery = baseQuery.where('status', '=', status);
      }
      if (name) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('name')} ILIKE ${'%' + name + '%'}`
        );
      }
      if (startDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('startTime')} >= ${startDate.toISOString()}`
        );
      }
      if (endDate) {
        baseQuery = baseQuery.where(
          sql<boolean>`${col('startTime')} <= ${endDate.toISOString()}`
        );
      }
      if (tags && Object.keys(tags).length > 0) {
        for (const [key, values] of Object.entries(tags)) {
          if (values.length === 0) continue;
          if (values.length === 1) {
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} = ${values[0]}`
            );
          } else {
            const valueList = sql.join(values.map((v) => sql`${v}`));
            baseQuery = baseQuery.where(
              sql<boolean>`${col('tags')}->>${key} IN (${valueList})`
            );
          }
        }
      }

      // Get total count
      const countResult = await baseQuery
        .select(sql<number>`COUNT(*)`.as('total'))
        .executeTakeFirst();

      const total = Number(countResult?.total ?? 0);

      // Get paginated data
      const data = await baseQuery
        .selectAll()
        .orderBy('startTime', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      return { data, total, limit, offset };
    },

    /**
     * Get a single trace with all its spans and events
     */
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

    /**
     * Get aggregate trace statistics for a date range
     */
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
          sql<number>`COALESCE(AVG(${col('durationMs')}), 0)`.as('avgDurationMs'),
          sql<number>`COUNT(CASE WHEN ${col('status')} = 'error' THEN 1 END)`.as('errorCount'),
          sql<number>`COALESCE(SUM(${col('totalCost')}), 0)`.as('totalCost'),
          sql<number>`COALESCE(SUM(${col('totalTokens')}), 0)`.as('totalTokens'),
          sql<number>`COALESCE(SUM(${col('spanCount')}), 0)`.as('totalSpans'),
        ])
        .where(sql<boolean>`${col('startTime')} >= ${startDate.toISOString()}`)
        .where(sql<boolean>`${col('startTime')} <= ${endDate.toISOString()}`);

      if (sessionId) {
        query = query.where('sessionId', '=', sessionId);
      }
      if (userId) {
        query = query.where('userId', '=', userId);
      }

      return query.executeTakeFirst();
    },
  };
};
