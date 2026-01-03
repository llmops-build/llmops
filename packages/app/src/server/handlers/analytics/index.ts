import { zv } from '@server/lib/zv';
import { internalServerError, successResponse } from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

/**
 * Convert micro-dollars to formatted dollar string
 */
function formatCost(microDollars: number, decimals = 6): string {
  const dollars = microDollars / 1_000_000;
  return `$${dollars.toFixed(decimals)}`;
}

/**
 * Database interface with analytics methods
 * Cast db to this type since these methods are added by createLLMRequestsDataLayer
 */
interface DbWithAnalytics {
  listRequests: (params: {
    limit?: number;
    offset?: number;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    provider?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string[]>;
  }) => Promise<unknown[]>;
  getRequestByRequestId: (requestId: string) => Promise<unknown | undefined>;
  getTotalCost: (params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    tags?: Record<string, string[]>;
  }) => Promise<
    | {
        totalCost: number;
        totalInputCost: number;
        totalOutputCost: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalTokens: number;
        requestCount: number;
      }
    | undefined
  >;
  getCostByModel: (params: {
    startDate: Date;
    endDate: Date;
  }) => Promise<unknown[]>;
  getCostByProvider: (params: {
    startDate: Date;
    endDate: Date;
  }) => Promise<unknown[]>;
  getCostByConfig: (params: {
    startDate: Date;
    endDate: Date;
  }) => Promise<unknown[]>;
  getDailyCosts: (params: {
    startDate: Date;
    endDate: Date;
  }) => Promise<unknown[]>;
  getCostSummary: (params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    tags?: Record<string, string[]>;
    groupBy?: 'day' | 'hour' | 'model' | 'provider' | 'config';
  }) => Promise<unknown[]>;
  getRequestStats: (params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    tags?: Record<string, string[]>;
  }) => Promise<
    | {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        streamingRequests: number;
        avgLatencyMs: number;
        maxLatencyMs: number;
        minLatencyMs: number;
      }
    | undefined
  >;
  getDistinctTags: () => Promise<Array<{ key: string; value: string }>>;
}

/**
 * Parse ISO date string to Date object
 * Accepts both ISO strings (2026-01-02T10:30:00.000Z) and date-only strings (2026-01-02)
 */
function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return date;
}

/**
 * Parse date string for start of range
 * - ISO strings are used as-is
 * - Date-only strings (YYYY-MM-DD) are treated as start of day UTC
 */
function parseStartDate(dateStr: string): Date {
  return parseDate(dateStr);
}

/**
 * Parse date string for end of range
 * - ISO strings are used as-is
 * - Date-only strings (YYYY-MM-DD) are set to end of day (23:59:59.999 UTC)
 */
function parseEndDate(dateStr: string): Date {
  const date = parseDate(dateStr);
  // Check if time component was provided (contains 'T')
  if (!dateStr.includes('T')) {
    // Only date provided - set to end of day UTC
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

/**
 * Zod schema for ISO date strings
 * Validates that the string can be parsed as a valid date
 */
const isoDateString = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message:
      'Invalid date format. Expected ISO 8601 string (e.g., 2026-01-02T10:30:00.000Z) or date string (e.g., 2026-01-02)',
  });

/**
 * Date range query schema
 * Accepts ISO 8601 date strings or date-only strings (YYYY-MM-DD)
 * - startDate: Used as-is for ISO strings, start of day for date-only
 * - endDate: Used as-is for ISO strings, end of day (23:59:59.999) for date-only
 */
const dateRangeSchema = z.object({
  startDate: isoDateString.transform(parseStartDate),
  endDate: isoDateString.transform(parseEndDate),
});

/**
 * Date range query schema with optional filters
 */
const dateRangeWithFiltersSchema = dateRangeSchema.extend({
  configId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  environmentId: z.string().uuid().optional(),
  tags: z.string().optional(), // JSON string of Record<string, string[]>
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
 * Analytics API routes for cost and usage tracking
 */
const app = new Hono()
  /**
   * GET /analytics/requests
   * List LLM requests with filtering and pagination
   */
  .get(
    '/requests',
    zv(
      'query',
      z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional(),
        configId: z.string().uuid().optional(),
        variantId: z.string().uuid().optional(),
        environmentId: z.string().uuid().optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        startDate: isoDateString.optional(),
        endDate: isoDateString.optional(),
        tags: z.string().optional(), // JSON string of key-value pairs
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithAnalytics;
      const query = c.req.valid('query');

      // Parse tags from JSON string if provided
      let parsedTags: Record<string, string[]> | undefined;
      if (query.tags) {
        try {
          parsedTags = JSON.parse(query.tags);
        } catch {
          // Ignore invalid JSON, treat as no tags filter
        }
      }

      try {
        const requests = await db.listRequests({
          limit: query.limit,
          offset: query.offset,
          configId: query.configId,
          variantId: query.variantId,
          environmentId: query.environmentId,
          provider: query.provider,
          model: query.model,
          startDate: query.startDate
            ? parseStartDate(query.startDate)
            : undefined,
          endDate: query.endDate ? parseEndDate(query.endDate) : undefined,
          tags: parsedTags,
        });

        return c.json(successResponse(requests, 200));
      } catch (error) {
        console.error('Error fetching requests:', error);
        return c.json(
          internalServerError('Failed to fetch requests', 500),
          500
        );
      }
    }
  )

  /**
   * GET /analytics/requests/:requestId
   * Get a single request by requestId
   */
  .get(
    '/requests/:requestId',
    zv(
      'param',
      z.object({
        requestId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithAnalytics;
      const { requestId } = c.req.valid('param');

      try {
        const request = await db.getRequestByRequestId(requestId);
        if (!request) {
          return c.json({ error: 'Request not found' }, 404);
        }
        return c.json(successResponse(request, 200));
      } catch (error) {
        console.error('Error fetching request:', error);
        return c.json(internalServerError('Failed to fetch request', 500), 500);
      }
    }
  )

  /**
   * GET /analytics/costs/total
   * Get total costs for a date range with optional filters
   */
  .get('/costs/total', zv('query', dateRangeWithFiltersSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate, configId, variantId, environmentId, tags } =
      c.req.valid('query');

    try {
      const data = await db.getTotalCost({
        startDate,
        endDate,
        configId,
        variantId,
        environmentId,
        tags: parseTags(tags),
      });
      if (!data) {
        return c.json(
          successResponse(
            {
              totalCost: 0,
              totalCostFormatted: '$0.000000',
              totalInputCost: 0,
              totalOutputCost: 0,
              totalPromptTokens: 0,
              totalCompletionTokens: 0,
              totalTokens: 0,
              requestCount: 0,
            },
            200
          )
        );
      }

      return c.json(
        successResponse(
          {
            ...data,
            totalCostFormatted: formatCost(data.totalCost),
            totalInputCostFormatted: formatCost(data.totalInputCost),
            totalOutputCostFormatted: formatCost(data.totalOutputCost),
          },
          200
        )
      );
    } catch (error) {
      console.error('Error fetching total costs:', error);
      return c.json(
        internalServerError('Failed to fetch total costs', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/costs/by-model
   * Get cost breakdown by model
   */
  .get('/costs/by-model', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getCostByModel({ startDate, endDate });
      return c.json(successResponse(data, 200));
    } catch (error) {
      console.error('Error fetching costs by model:', error);
      return c.json(
        internalServerError('Failed to fetch costs by model', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/costs/by-provider
   * Get cost breakdown by provider
   */
  .get('/costs/by-provider', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getCostByProvider({ startDate, endDate });
      return c.json(successResponse(data, 200));
    } catch (error) {
      console.error('Error fetching costs by provider:', error);
      return c.json(
        internalServerError('Failed to fetch costs by provider', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/costs/by-config
   * Get cost breakdown by config
   */
  .get('/costs/by-config', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getCostByConfig({ startDate, endDate });
      return c.json(successResponse(data, 200));
    } catch (error) {
      console.error('Error fetching costs by config:', error);
      return c.json(
        internalServerError('Failed to fetch costs by config', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/costs/daily
   * Get daily cost breakdown
   */
  .get('/costs/daily', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getDailyCosts({ startDate, endDate });
      return c.json(successResponse(data, 200));
    } catch (error) {
      console.error('Error fetching daily costs:', error);
      return c.json(
        internalServerError('Failed to fetch daily costs', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/costs/summary
   * Get cost summary with flexible grouping and optional filters
   */
  .get(
    '/costs/summary',
    zv(
      'query',
      dateRangeWithFiltersSchema.extend({
        groupBy: z
          .enum(['day', 'hour', 'model', 'provider', 'config'])
          .optional(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithAnalytics;
      const {
        startDate,
        endDate,
        groupBy,
        configId,
        variantId,
        environmentId,
        tags,
      } = c.req.valid('query');

      try {
        const data = await db.getCostSummary({
          startDate,
          endDate,
          groupBy,
          configId,
          variantId,
          environmentId,
          tags: parseTags(tags),
        });
        return c.json(successResponse(data, 200));
      } catch (error) {
        console.error('Error fetching cost summary:', error);
        return c.json(
          internalServerError('Failed to fetch cost summary', 500),
          500
        );
      }
    }
  )

  /**
   * GET /analytics/stats
   * Get request statistics for a date range with optional filters
   */
  .get('/stats', zv('query', dateRangeWithFiltersSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate, configId, variantId, environmentId, tags } =
      c.req.valid('query');

    try {
      const data = await db.getRequestStats({
        startDate,
        endDate,
        configId,
        variantId,
        environmentId,
        tags: parseTags(tags),
      });
      if (!data) {
        return c.json(
          successResponse(
            {
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
              streamingRequests: 0,
              avgLatencyMs: 0,
              maxLatencyMs: 0,
              minLatencyMs: 0,
              successRate: 0,
            },
            200
          )
        );
      }

      return c.json(
        successResponse(
          {
            ...data,
            successRate:
              data.totalRequests > 0
                ? (
                    (data.successfulRequests / data.totalRequests) *
                    100
                  ).toFixed(2)
                : 0,
          },
          200
        )
      );
    } catch (error) {
      console.error('Error fetching request stats:', error);
      return c.json(
        internalServerError('Failed to fetch request stats', 500),
        500
      );
    }
  })

  /**
   * GET /analytics/tags
   * Get distinct tag key-value pairs from all requests
   */
  .get('/tags', async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;

    try {
      const tags = await db.getDistinctTags();
      return c.json(successResponse(tags, 200));
    } catch (error) {
      console.error('Error fetching distinct tags:', error);
      return c.json(internalServerError('Failed to fetch tags', 500), 500);
    }
  });

export default app;
