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
    provider?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
  }) => Promise<unknown[]>;
  getRequestByRequestId: (requestId: string) => Promise<unknown | undefined>;
  getTotalCost: (params: { startDate: Date; endDate: Date }) => Promise<
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
    groupBy?: 'day' | 'hour' | 'model' | 'provider' | 'config';
  }) => Promise<unknown[]>;
  getRequestStats: (params: { startDate: Date; endDate: Date }) => Promise<
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
}

/**
 * Parse date string and set to start of day (00:00:00.000)
 */
function parseStartDate(dateStr: string): Date {
  const date = new Date(dateStr);
  // If only date is provided (no time component), it's already at 00:00:00 UTC
  return date;
}

/**
 * Parse date string and set to end of day (23:59:59.999)
 * This ensures that when users specify endDate=2026-01-02, all records from that day are included
 */
function parseEndDate(dateStr: string): Date {
  const date = new Date(dateStr);
  // Check if time component was provided (contains 'T' or has non-zero time)
  if (!dateStr.includes('T') && !dateStr.includes(':')) {
    // Only date provided - set to end of day
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

/**
 * Date range query schema
 * - startDate: parsed as start of day (00:00:00.000)
 * - endDate: parsed as end of day (23:59:59.999) when only date is provided
 */
const dateRangeSchema = z.object({
  startDate: z.string().transform(parseStartDate),
  endDate: z.string().transform(parseEndDate),
});

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
        provider: z.string().optional(),
        model: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithAnalytics;
      const query = c.req.valid('query');

      try {
        const requests = await db.listRequests({
          limit: query.limit,
          offset: query.offset,
          configId: query.configId,
          provider: query.provider,
          model: query.model,
          startDate: query.startDate
            ? parseStartDate(query.startDate)
            : undefined,
          endDate: query.endDate ? parseEndDate(query.endDate) : undefined,
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
   * Get total costs for a date range
   */
  .get('/costs/total', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getTotalCost({ startDate, endDate });
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
   * Get cost summary with flexible grouping
   */
  .get(
    '/costs/summary',
    zv(
      'query',
      dateRangeSchema.extend({
        groupBy: z
          .enum(['day', 'hour', 'model', 'provider', 'config'])
          .optional(),
      })
    ),
    async (c) => {
      const db = c.get('db') as unknown as DbWithAnalytics;
      const { startDate, endDate, groupBy } = c.req.valid('query');

      try {
        const data = await db.getCostSummary({ startDate, endDate, groupBy });
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
   * Get request statistics for a date range
   */
  .get('/stats', zv('query', dateRangeSchema), async (c) => {
    const db = c.get('db') as unknown as DbWithAnalytics;
    const { startDate, endDate } = c.req.valid('query');

    try {
      const data = await db.getRequestStats({ startDate, endDate });
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
  });

export default app;
