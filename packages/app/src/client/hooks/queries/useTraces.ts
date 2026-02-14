import { hc } from '@client/lib/hc';
import { useQuery } from '@tanstack/react-query';

export type TraceRow = {
  id: string;
  traceId: string;
  name: string | null;
  sessionId: string | null;
  userId: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  spanCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  tags: Record<string, string>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedTracesResponse = {
  data: TraceRow[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * List traces with filtering and pagination
 */
export type SpanRow = {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  kind: number;
  status: number;
  statusMessage: string | null;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  provider: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  source: string;
  input: unknown | null;
  output: unknown | null;
  attributes: Record<string, unknown>;
};

export type SpanEventRow = {
  id: string;
  traceId: string;
  spanId: string;
  name: string;
  timestamp: string;
  attributes: Record<string, unknown>;
};

export type TraceDetailResponse = {
  trace: TraceRow;
  spans: SpanRow[];
  events: SpanEventRow[];
};

/**
 * Fetch a single trace with all spans and events
 */
export const useTraceDetail = (traceId: string) => {
  return useQuery({
    queryKey: ['traces', 'detail', traceId],
    queryFn: async () => {
      const response = await hc.v1.traces[':traceId'].$get({
        param: { traceId },
      });
      const result = await response.json();
      return ('data' in result ? result.data : undefined) as
        | TraceDetailResponse
        | undefined;
    },
    enabled: !!traceId,
  });
};

export const useTraceList = (
  params: {
    limit?: number;
    offset?: number;
    sessionId?: string;
    userId?: string;
    status?: 'unset' | 'ok' | 'error';
    name?: string;
    startDate?: string;
    endDate?: string;
    tags?: Record<string, string[]>;
  } = {},
  enabled = true
) => {
  return useQuery({
    queryKey: ['traces', 'list', params],
    queryFn: async () => {
      const query = {
        ...(params.limit !== undefined && { limit: String(params.limit) }),
        ...(params.offset !== undefined && { offset: String(params.offset) }),
        ...(params.sessionId && { sessionId: params.sessionId }),
        ...(params.userId && { userId: params.userId }),
        ...(params.status && { status: params.status }),
        ...(params.name && { name: params.name }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.tags &&
          Object.keys(params.tags).length > 0 && {
            tags: JSON.stringify(params.tags),
          }),
      };

      const response = await hc.v1.traces.$get({ query });
      const result = await response.json();
      return (
        'data' in result
          ? result.data
          : {
              data: [],
              total: 0,
              limit: params.limit ?? 50,
              offset: params.offset ?? 0,
            }
      ) as PaginatedTracesResponse;
    },
    enabled,
  });
};
