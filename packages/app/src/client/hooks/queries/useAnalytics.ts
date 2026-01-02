import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get total costs for a date range
 */
export const useTotalCost = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'total', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs.total.$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as {
        totalCost: number;
        totalCostFormatted: string;
        totalInputCost: number;
        totalInputCostFormatted: string;
        totalOutputCost: number;
        totalOutputCostFormatted: string;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalTokens: number;
        requestCount: number;
      } | null;
    },
    enabled,
  });
};

/**
 * Get cost breakdown by model
 */
export const useCostByModel = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'by-model', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs['by-model'].$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as Array<{
        provider: string;
        model: string;
        totalCost: number;
        totalInputCost: number;
        totalOutputCost: number;
        totalTokens: number;
        requestCount: number;
        avgLatencyMs: number;
      }>;
    },
    enabled,
  });
};

/**
 * Get cost breakdown by provider
 */
export const useCostByProvider = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'by-provider', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs['by-provider'].$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as Array<{
        provider: string;
        totalCost: number;
        totalInputCost: number;
        totalOutputCost: number;
        totalTokens: number;
        requestCount: number;
        avgLatencyMs: number;
      }>;
    },
    enabled,
  });
};

/**
 * Get cost breakdown by config
 */
export const useCostByConfig = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'by-config', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs['by-config'].$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as Array<{
        configId: string | null;
        configName: string | null;
        configSlug: string | null;
        totalCost: number;
        totalInputCost: number;
        totalOutputCost: number;
        totalTokens: number;
        requestCount: number;
      }>;
    },
    enabled,
  });
};

/**
 * Get daily cost breakdown
 */
export const useDailyCosts = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'daily', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs.daily.$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as Array<{
        date: string;
        totalCost: number;
        totalInputCost: number;
        totalOutputCost: number;
        totalTokens: number;
        requestCount: number;
      }>;
    },
    enabled,
  });
};

/**
 * Get cost summary with flexible grouping
 */
export const useCostSummary = (
  params: DateRange & {
    groupBy?: 'day' | 'hour' | 'model' | 'provider' | 'config';
  },
  enabled = true
) => {
  return useQuery({
    queryKey: ['analytics', 'costs', 'summary', params],
    queryFn: async () => {
      const response = await hc.v1.analytics.costs.summary.$get({
        query: params,
      });
      const result = await response.json();
      return ('data' in result ? result.data : []) as Array<{
        groupKey: string;
        totalCost: number;
        requestCount: number;
      }>;
    },
    enabled,
  });
};

/**
 * Get request statistics
 */
export const useRequestStats = (dateRange: DateRange, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'stats', dateRange],
    queryFn: async () => {
      const response = await hc.v1.analytics.stats.$get({
        query: dateRange,
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        streamingRequests: number;
        avgLatencyMs: number;
        maxLatencyMs: number;
        minLatencyMs: number;
        successRate: string | number;
      } | null;
    },
    enabled,
  });
};

export type LLMRequest = {
  id: string;
  requestId: string;
  configId: string | null;
  variantId: string | null;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  cost: number;
  inputCost: number;
  outputCost: number;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  isStreaming: boolean;
  userId: string | null;
  tags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedRequestsResponse = {
  data: LLMRequest[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * List LLM requests with filtering and pagination
 */
export const useRequestList = (
  params: {
    limit?: number;
    offset?: number;
    configId?: string;
    provider?: string;
    model?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  enabled = true
) => {
  return useQuery({
    queryKey: ['analytics', 'requests', params],
    queryFn: async () => {
      const query = {
        ...(params.limit !== undefined && { limit: String(params.limit) }),
        ...(params.offset !== undefined && { offset: String(params.offset) }),
        ...(params.configId && { configId: params.configId }),
        ...(params.provider && { provider: params.provider }),
        ...(params.model && { model: params.model }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
      };

      const response = await hc.v1.analytics.requests.$get({ query });
      const result = await response.json();
      return (
        'data' in result
          ? result.data
          : {
              data: [],
              total: 0,
              limit: params.limit ?? 100,
              offset: params.offset ?? 0,
            }
      ) as PaginatedRequestsResponse;
    },
    enabled,
  });
};

/**
 * Get a single request by requestId
 */
export const useRequestById = (requestId: string, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'requests', requestId],
    queryFn: async () => {
      const response = await hc.v1.analytics.requests[':requestId'].$get({
        param: { requestId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : null) as {
        id: string;
        requestId: string;
        configId: string | null;
        variantId: string | null;
        provider: string;
        model: string;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens: number;
        cost: number;
        inputCost: number;
        outputCost: number;
        endpoint: string;
        statusCode: number;
        latencyMs: number;
        isStreaming: boolean;
        userId: string | null;
        tags: Record<string, string>;
        createdAt: string;
        updatedAt: string;
      } | null;
    },
    enabled: enabled && !!requestId,
  });
};
