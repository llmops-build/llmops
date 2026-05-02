import { zv } from '@server/lib/zv';
import { internalServerError, successResponse } from '@shared/responses';
import {
  createOtlpQueryClient,
  type OtlpQueryClient,
} from '@server/services/otlpQueryClient';
import type { OtlpConfig } from '@llmops/core';
import { Hono } from 'hono';
import z from 'zod';

/**
 * Database interface with trace query methods
 */
interface DbWithTraces {
  listTraces: (params: {
    limit?: number;
    offset?: number;
    sessionId?: string;
    userId?: string;
    status?: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string[]>;
  }) => Promise<{
    data: unknown[];
    total: number;
    limit: number;
    offset: number;
  }>;
  getTraceWithSpans: (
    traceId: string
  ) => Promise<
    { trace: unknown; spans: unknown[]; events: unknown[] } | undefined
  >;
  getTraceStats: (params: {
    startDate: Date;
    endDate: Date;
    sessionId?: string;
    userId?: string;
  }) => Promise<unknown | undefined>;
}

/**
 * Cached OTLP query client singleton (created once per endpoint config)
 */
let cachedOtlpClient: OtlpQueryClient | null = null;
let cachedOtlpEndpoint: string | null = null;

function getOtlpClient(otlp: OtlpConfig): OtlpQueryClient {
  if (cachedOtlpClient && cachedOtlpEndpoint === otlp.endpoint) {
    return cachedOtlpClient;
  }
  cachedOtlpClient = createOtlpQueryClient(otlp);
  cachedOtlpEndpoint = otlp.endpoint;
  return cachedOtlpClient;
}

/**
 * Parse ISO date string to Date object
 */
const isoDateString = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date format. Expected ISO 8601 string.',
  });

function parseStartDate(dateStr: string): Date {
  return new Date(dateStr);
}

function parseEndDate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (!dateStr.includes('T')) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

const dateRangeSchema = z.object({
  startDate: isoDateString.transform(parseStartDate),
  endDate: isoDateString.transform(parseEndDate),
});

/**
 * Parse tags JSON string to Record<string, string[]>
 */
function parseTags(tagsJson?: string): Record<string, string[]> | undefined {
  if (!tagsJson) return undefined;
  try {
    return JSON.parse(tagsJson);
  } catch {
    return undefined;
  }
}

/**
 * Traces API routes
 */
const app = new Hono()
  /**
   * GET /traces
   * List traces with filters and pagination
   */
  .get(
    '/',
    zv(
      'query',
      z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
        sessionId: z.string().optional(),
        userId: z.string().optional(),
        status: z.enum(['unset', 'ok', 'error']).optional(),
        name: z.string().optional(),
        startDate: isoDateString.optional(),
        endDate: isoDateString.optional(),
        tags: z.string().optional(),
      })
    ),
    async (c) => {
      const otlp = c.get('llmopsConfig')?.otlp;
      const query = c.req.valid('query');

      const params = {
        limit: query.limit,
        offset: query.offset,
        sessionId: query.sessionId,
        userId: query.userId,
        status: query.status,
        name: query.name,
        startDate: query.startDate
          ? parseStartDate(query.startDate)
          : undefined,
        endDate: query.endDate ? parseEndDate(query.endDate) : undefined,
        tags: parseTags(query.tags),
      };

      try {
        if (otlp) {
          const client = getOtlpClient(otlp);
          const result = await client.listTraces(params);
          return c.json(successResponse(result, 200));
        }

        const db = c.get('db') as unknown as DbWithTraces;
        const result = await db.listTraces(params);
        return c.json(successResponse(result, 200));
      } catch (error) {
        console.error('Error fetching traces:', error);
        return c.json(
          internalServerError('Failed to fetch traces', 500),
          500
        );
      }
    }
  )

  /**
   * GET /traces/:traceId
   * Get a single trace with all spans and events (waterfall data)
   */
  .get(
    '/:traceId',
    zv(
      'param',
      z.object({
        traceId: z.string(),
      })
    ),
    async (c) => {
      const otlp = c.get('llmopsConfig')?.otlp;
      const { traceId } = c.req.valid('param');

      try {
        if (otlp) {
          const client = getOtlpClient(otlp);
          const result = await client.getTraceWithSpans(traceId);
          if (!result) {
            return c.json({ error: 'Trace not found' }, 404);
          }
          return c.json(successResponse(result, 200));
        }

        const db = c.get('db') as unknown as DbWithTraces;
        const result = await db.getTraceWithSpans(traceId);
        if (!result) {
          return c.json({ error: 'Trace not found' }, 404);
        }
        return c.json(successResponse(result, 200));
      } catch (error) {
        console.error('Error fetching trace:', error);
        return c.json(
          internalServerError('Failed to fetch trace', 500),
          500
        );
      }
    }
  )

  /**
   * GET /traces/stats
   * Get aggregate trace statistics for a date range
   */
  .get(
    '/stats',
    zv(
      'query',
      dateRangeSchema.extend({
        sessionId: z.string().optional(),
        userId: z.string().optional(),
      })
    ),
    async (c) => {
      const otlp = c.get('llmopsConfig')?.otlp;
      const { startDate, endDate, sessionId, userId } = c.req.valid('query');

      try {
        if (otlp) {
          const client = getOtlpClient(otlp);
          const data = await client.getTraceStats({
            startDate,
            endDate,
            sessionId,
            userId,
          });
          return c.json(successResponse(data, 200));
        }

        const db = c.get('db') as unknown as DbWithTraces;
        const data = await db.getTraceStats({
          startDate,
          endDate,
          sessionId,
          userId,
        });

        if (!data) {
          return c.json(
            successResponse(
              {
                totalTraces: 0,
                avgDurationMs: 0,
                errorCount: 0,
                totalCost: 0,
                totalTokens: 0,
                totalSpans: 0,
              },
              200
            )
          );
        }

        return c.json(successResponse(data, 200));
      } catch (error) {
        console.error('Error fetching trace stats:', error);
        return c.json(
          internalServerError('Failed to fetch trace stats', 500),
          500
        );
      }
    }
  );

export default app;
