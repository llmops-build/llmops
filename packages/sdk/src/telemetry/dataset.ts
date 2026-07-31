import type {
  Datapoint,
  DatasetQuery,
  EvaluationDataset,
  LLMRequestRecord,
} from '@llmops/core';

interface StoredRequest {
  requestId: string;
  traceId?: string | null;
  spanId?: string | null;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  cachedTokens?: number;
  cacheCreationTokens?: number;
  cost?: number;
  latencyMs?: number;
  isStreaming?: boolean;
  endpoint?: string;
  statusCode?: number;
  tags?: Record<string, string> | string;
  createdAt?: Date | string;
}

interface StoredSpan {
  requestId?: string | null;
  spanId?: string | null;
  input?: unknown;
  output?: unknown;
  statusMessage?: string | null;
}

export interface DatasetStoreReader {
  listRequests(params?: {
    limit?: number;
    offset?: number;
    provider?: string;
    model?: string;
    startDate?: Date;
    tags?: Record<string, string[]>;
  }): Promise<{
    data: unknown[];
    total: number;
    limit: number;
    offset: number;
  }>;
  getTraceWithSpans(
    traceId: string,
  ): Promise<
    { trace: unknown; spans: unknown[]; events: unknown[] } | undefined
  >;
}

const DEFAULT_DATASET_LIMIT = 100;

function parseSince(since: string | undefined): Date | undefined {
  if (!since) return undefined;

  const relative = /^(\d+)(m|h|d|w)$/.exec(since);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2] as 'm' | 'h' | 'd' | 'w';
    const unitMs = {
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
      w: 604_800_000,
    }[unit];
    return new Date(Date.now() - amount * unitMs);
  }

  const absolute = new Date(since);
  if (Number.isNaN(absolute.getTime())) {
    throw new Error(
      `dataset(): invalid since value "${since}"; use an ISO date or a relative value such as "7d"`,
    );
  }
  return absolute;
}

function parseTags(tags: StoredRequest['tags']): Record<string, string> {
  if (!tags) return {};
  if (typeof tags !== 'string') return tags;
  try {
    return JSON.parse(tags) as Record<string, string>;
  } catch {
    return {};
  }
}

function toIsoString(value: StoredRequest['createdAt']): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return new Date(value).toISOString();
  return new Date(0).toISOString();
}

function findSpan(
  request: StoredRequest,
  spans: unknown[],
): StoredSpan | undefined {
  return (spans as StoredSpan[]).find(
    (span) =>
      span.requestId === request.requestId ||
      (request.spanId != null && span.spanId === request.spanId),
  );
}

function toRequestRecord(
  request: StoredRequest,
  span: StoredSpan | undefined,
): LLMRequestRecord {
  const statusCode = request.statusCode ?? 200;
  return {
    requestId: request.requestId,
    traceId: request.traceId ?? undefined,
    spanId: request.spanId ?? undefined,
    provider: request.provider,
    model: request.model,
    input: span?.input ?? null,
    output: span?.output ?? null,
    usage: {
      inputTokens: request.promptTokens ?? 0,
      outputTokens: request.completionTokens ?? 0,
      cacheReadTokens: request.cachedTokens ?? 0,
      cacheWriteTokens: request.cacheCreationTokens ?? 0,
    },
    cost: (request.cost ?? 0) / 1_000_000,
    latencyMs: request.latencyMs ?? 0,
    isStreaming: request.isStreaming ?? false,
    endpoint: request.endpoint,
    statusCode,
    status: statusCode >= 400 ? 'error' : 'success',
    error: span?.statusMessage ?? undefined,
    tags: parseTags(request.tags),
    startedAt: toIsoString(request.createdAt),
  };
}

class TelemetryDataset<D, T> implements EvaluationDataset<D, T> {
  private loaded?: Promise<Datapoint<D, T>[]>;

  constructor(
    private readonly store: DatasetStoreReader,
    private readonly query: DatasetQuery<D, T>,
  ) {}

  private load(): Promise<Datapoint<D, T>[]> {
    this.loaded ??= this.loadRows();
    return this.loaded;
  }

  private async loadRows(): Promise<Datapoint<D, T>[]> {
    const page = await this.store.listRequests({
      provider: this.query.provider,
      model: this.query.model,
      startDate: parseSince(this.query.since),
      limit: this.query.limit ?? DEFAULT_DATASET_LIMIT,
      offset: 0,
      tags: this.query.tags,
    });
    const requests = page.data as StoredRequest[];
    const traces = new Map<
      string,
      Promise<
        { trace: unknown; spans: unknown[]; events: unknown[] } | undefined
      >
    >();

    return Promise.all(
      requests.map(async (request) => {
        let span: StoredSpan | undefined;
        if (request.traceId) {
          let trace = traces.get(request.traceId);
          if (!trace) {
            trace = this.store.getTraceWithSpans(request.traceId);
            traces.set(request.traceId, trace);
          }
          span = findSpan(request, (await trace)?.spans ?? []);
        }
        return this.query.map(toRequestRecord(request, span));
      }),
    );
  }

  async size(): Promise<number> {
    return (await this.load()).length;
  }

  async get(index: number): Promise<Datapoint<D, T>> {
    return (await this.load())[index];
  }

  async slice(start: number, end: number): Promise<Datapoint<D, T>[]> {
    return (await this.load()).slice(start, end);
  }
}

export function createTelemetryDataset<D, T>(
  store: DatasetStoreReader,
  query: DatasetQuery<D, T>,
): EvaluationDataset<D, T> {
  return new TelemetryDataset(store, query);
}
