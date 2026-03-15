import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
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
  listSpanAnnotations: (params: {
    spanId: string;
  }) => Promise<unknown[]>;
  createSpanAnnotation: (params: {
    traceId: string;
    spanId: string;
    type: 'score' | 'label' | 'comment';
    value: Record<string, unknown>;
  }) => Promise<unknown | undefined>;
  updateSpanAnnotation: (params: {
    annotationId: string;
    type?: 'score' | 'label' | 'comment';
    value?: Record<string, unknown>;
  }) => Promise<unknown | undefined>;
  deleteSpanAnnotation: (params: {
    annotationId: string;
  }) => Promise<unknown | undefined>;
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
      const db = c.get('db') as unknown as DbWithTraces;
      const query = c.req.valid('query');

      try {
        const result = await db.listTraces({
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
        });

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
      const db = c.get('db') as unknown as DbWithTraces;
      const { traceId } = c.req.valid('param');

      try {
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
      const db = c.get('db') as unknown as DbWithTraces;
      const { startDate, endDate, sessionId, userId } = c.req.valid('query');

      try {
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
  )

  // ============ Span Annotations ============

  /**
   * GET /traces/:traceId/spans/:spanId/annotations
   * List annotations for a span
   */
  .get(
    '/:traceId/spans/:spanId/annotations',
    zv(
      'param',
      z.object({
        traceId: z.string(),
        spanId: z.string(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithTraces;
      const { spanId } = c.req.valid('param');

      try {
        const annotations = await db.listSpanAnnotations({ spanId });
        return c.json(successResponse(annotations, 200));
      } catch (error) {
        console.error('Error fetching annotations:', error);
        return c.json(
          internalServerError('Failed to fetch annotations', 500),
          500
        );
      }
    }
  )

  /**
   * POST /traces/:traceId/spans/:spanId/annotations
   * Create an annotation on a span
   */
  .post(
    '/:traceId/spans/:spanId/annotations',
    zv(
      'param',
      z.object({
        traceId: z.string(),
        spanId: z.string(),
      })
    ),
    zv(
      'json',
      z.object({
        type: z.enum(['score', 'label', 'comment']),
        value: z.record(z.string(), z.unknown()),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithTraces;
      const { traceId, spanId } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const annotation = await db.createSpanAnnotation({
          traceId,
          spanId,
          ...body,
        });
        if (!annotation) {
          return c.json(
            internalServerError('Failed to create annotation', 500),
            500
          );
        }
        return c.json(successResponse(annotation, 200));
      } catch (error) {
        console.error('Error creating annotation:', error);
        return c.json(
          internalServerError('Failed to create annotation', 500),
          500
        );
      }
    }
  )

  /**
   * PATCH /traces/:traceId/spans/:spanId/annotations/:annotationId
   * Update an annotation
   */
  .patch(
    '/:traceId/spans/:spanId/annotations/:annotationId',
    zv(
      'param',
      z.object({
        traceId: z.string(),
        spanId: z.string(),
        annotationId: z.string(),
      })
    ),
    zv(
      'json',
      z.object({
        type: z.enum(['score', 'label', 'comment']).optional(),
        value: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithTraces;
      const { annotationId } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const annotation = await db.updateSpanAnnotation({
          annotationId,
          ...body,
        });
        if (!annotation) {
          return c.json(
            clientErrorResponse('Annotation not found', 404),
            404
          );
        }
        return c.json(successResponse(annotation, 200));
      } catch (error) {
        console.error('Error updating annotation:', error);
        return c.json(
          internalServerError('Failed to update annotation', 500),
          500
        );
      }
    }
  )

  /**
   * DELETE /traces/:traceId/spans/:spanId/annotations/:annotationId
   * Delete an annotation
   */
  .delete(
    '/:traceId/spans/:spanId/annotations/:annotationId',
    zv(
      'param',
      z.object({
        traceId: z.string(),
        spanId: z.string(),
        annotationId: z.string(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithTraces;
      const { annotationId } = c.req.valid('param');

      try {
        const annotation = await db.deleteSpanAnnotation({ annotationId });
        if (!annotation) {
          return c.json(
            clientErrorResponse('Annotation not found', 404),
            404
          );
        }
        return c.json(successResponse(annotation, 200));
      } catch (error) {
        console.error('Error deleting annotation:', error);
        return c.json(
          internalServerError('Failed to delete annotation', 500),
          500
        );
      }
    }
  );

export default app;
