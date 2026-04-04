import type {
  LLMRequestInsert,
  TraceUpsert,
  SpanInsert,
  SpanEventInsert,
  CostSummaryGroupBy,
} from './pg-store';

/**
 * TelemetryStore provides read + write access to telemetry data.
 * Implemented by pgStore, d1Store, and future store backends.
 */
export interface TelemetryStore {
  // ── LLM Requests: writes ──────────────────────────────────────────
  batchInsertRequests(requests: LLMRequestInsert[]): Promise<{ count: number }>;
  insertRequest(request: LLMRequestInsert): Promise<unknown>;

  // ── LLM Requests: reads ───────────────────────────────────────────
  listRequests(params?: {
    limit?: number;
    offset?: number;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    providerConfigId?: string;
    provider?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string[]>;
  }): Promise<{ data: unknown[]; total: number; limit: number; offset: number }>;

  getRequestByRequestId(requestId: string): Promise<unknown | undefined>;

  getTotalCost(params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    tags?: Record<string, string[]>;
  }): Promise<unknown>;

  getCostByModel(params: { startDate: Date; endDate: Date }): Promise<unknown[]>;
  getCostByProvider(params: { startDate: Date; endDate: Date }): Promise<unknown[]>;
  getDailyCosts(params: { startDate: Date; endDate: Date }): Promise<unknown[]>;

  getCostSummary(params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    groupBy?: CostSummaryGroupBy;
    tags?: Record<string, string[]>;
    tagKeys?: string[];
  }): Promise<unknown[]>;

  getRequestStats(params: {
    startDate: Date;
    endDate: Date;
    configId?: string;
    variantId?: string;
    environmentId?: string;
    tags?: Record<string, string[]>;
  }): Promise<unknown>;

  getDistinctTags(): Promise<unknown[]>;

  // ── Traces: writes ────────────────────────────────────────────────
  upsertTrace(data: TraceUpsert): Promise<void>;
  batchInsertSpans(spans: SpanInsert[]): Promise<{ count: number }>;
  batchInsertSpanEvents(events: SpanEventInsert[]): Promise<{ count: number }>;

  // ── Traces: reads ─────────────────────────────────────────────────
  listTraces(params?: {
    limit?: number;
    offset?: number;
    sessionId?: string;
    userId?: string;
    status?: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: Record<string, string[]>;
  }): Promise<{ data: unknown[]; total: number; limit: number; offset: number }>;

  getTraceWithSpans(traceId: string): Promise<
    { trace: unknown; spans: unknown[]; events: unknown[] } | undefined
  >;

  getTraceStats(params: {
    startDate: Date;
    endDate: Date;
    sessionId?: string;
    userId?: string;
  }): Promise<unknown>;
}
