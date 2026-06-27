import type { Datapoint, EvaluationDataset } from '../eval/dataset';
import type { LLMRequestRecord, SpanRecord, TraceRecord } from './events';

/** A page of results from a list query. */
export interface Page<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface RequestQuery {
  limit?: number;
  offset?: number;
  provider?: string;
  model?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: Record<string, string[]>;
}

export interface TraceQuery {
  limit?: number;
  offset?: number;
  sessionId?: string;
  userId?: string;
  status?: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: Record<string, string[]>;
}

export interface CostQuery {
  startDate: Date;
  endDate: Date;
  /** Column to group costs by, e.g. 'model' | 'provider' | 'day'. */
  groupBy?: string;
  tags?: Record<string, string[]>;
}

export interface CostRow {
  group: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  requests: number;
}

/**
 * Turns stored telemetry into eval datapoints — the traces→datasets bridge.
 *
 * `map` adapts each stored LLM request into the `{ data, target }` shape your
 * evaluators expect. Production rows have no ground-truth `target`, so you
 * synthesize one (for regression, `target` is often the previous output).
 *
 * Crucially this returns the SAME `EvaluationDataset` interface that inline
 * arrays implement, so `evaluate()` consumes production traffic with zero
 * special-casing.
 */
export interface DatasetQuery<
  D = Record<string, unknown>,
  T = Record<string, unknown>,
> {
  model?: string;
  provider?: string;
  /** Relative ('7d', '24h') or absolute ISO date. */
  since?: string;
  limit?: number;
  tags?: Record<string, string[]>;
  map: (record: LLMRequestRecord) => Datapoint<D, T>;
}

/**
 * The READ half of telemetry.
 *
 * The dashboard and the eval dataset-bridge depend ONLY on this; they never
 * write. A store implements both halves, but neither consumer can reach across
 * the seam — which is what keeps the dashboard runnable against a read replica
 * and the dataset-bridge runnable without the gateway.
 */
export interface TelemetryReader {
  listRequests(query?: RequestQuery): Promise<Page<LLMRequestRecord>>;
  listTraces(query?: TraceQuery): Promise<Page<TraceRecord>>;
  getTrace(
    traceId: string,
  ): Promise<{ trace: TraceRecord; spans: SpanRecord[] } | undefined>;
  getCostSummary(query: CostQuery): Promise<CostRow[]>;

  /** The bridge to evals — see {@link DatasetQuery}. */
  dataset<D = Record<string, unknown>, T = Record<string, unknown>>(
    query: DatasetQuery<D, T>,
  ): EvaluationDataset<D, T>;
}
