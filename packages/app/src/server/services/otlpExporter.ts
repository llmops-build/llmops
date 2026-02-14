import { logger } from '@llmops/core';

/**
 * OTLP Exporter — forwards spans to an external OTLP collector.
 *
 * Reads config from environment variables:
 * - LLMOPS_OTLP_ENDPOINT — base URL (e.g. https://otel.example.com)
 * - LLMOPS_OTLP_HEADERS — comma-separated key=value pairs for extra headers
 *
 * If LLMOPS_OTLP_ENDPOINT is not set, this is a no-op.
 */

interface OtlpSpanData {
  traceId: string;
  spanId: string;
  parentSpanId?: string | null;
  name: string;
  kind: number;
  startTime: Date;
  endTime: Date | null;
  status: number;
  statusMessage?: string | null;
  attributes: Record<string, unknown>;
  events?: Array<{
    name: string;
    timestamp: Date;
    attributes: Record<string, unknown>;
  }>;
}

interface OtlpExporterConfig {
  endpoint?: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushIntervalMs?: number;
}

/**
 * Convert a value to OTLP attribute value format
 */
function toOtlpValue(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { intValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { boolValue: value };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((v) => toOtlpValue(v)),
      },
    };
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return { stringValue: JSON.stringify(value) };
    } catch {
      return { stringValue: String(value) };
    }
  }
  return { stringValue: String(value) };
}

/**
 * Convert attributes to OTLP format
 */
function toOtlpAttributes(
  attrs: Record<string, unknown>
): Array<{ key: string; value: Record<string, unknown> }> {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => ({
      key,
      value: toOtlpValue(value),
    }));
}

/**
 * Convert Date to nanosecond string
 */
function dateToNano(date: Date): string {
  return (BigInt(date.getTime()) * BigInt(1_000_000)).toString();
}

export interface OtlpExporter {
  export(spans: OtlpSpanData[]): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
  isEnabled(): boolean;
}

export function createOtlpExporter(
  config?: OtlpExporterConfig
): OtlpExporter {
  const endpoint =
    config?.endpoint ?? process.env.LLMOPS_OTLP_ENDPOINT ?? '';
  const batchSize = config?.batchSize ?? 50;
  const flushIntervalMs = config?.flushIntervalMs ?? 5000;

  // Parse headers from env
  let headers: Record<string, string> = config?.headers ?? {};
  const envHeaders = process.env.LLMOPS_OTLP_HEADERS;
  if (envHeaders) {
    for (const pair of envHeaders.split(',')) {
      const [key, ...valueParts] = pair.split('=');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  if (!endpoint) {
    // No-op exporter
    return {
      export: () => {},
      flush: async () => {},
      shutdown: async () => {},
      isEnabled: () => false,
    };
  }

  const url = `${endpoint.replace(/\/$/, '')}/v1/traces`;
  let queue: OtlpSpanData[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  async function sendBatch(batch: OtlpSpanData[]): Promise<void> {
    const body = {
      resourceSpans: [
        {
          resource: {
            attributes: toOtlpAttributes({
              'service.name': 'llmops-gateway',
            }),
          },
          scopeSpans: [
            {
              scope: { name: 'llmops', version: '1.0.0' },
              spans: batch.map((span) => ({
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId || undefined,
                name: span.name,
                kind: span.kind,
                startTimeUnixNano: dateToNano(span.startTime),
                endTimeUnixNano: span.endTime
                  ? dateToNano(span.endTime)
                  : undefined,
                attributes: toOtlpAttributes(span.attributes),
                events: (span.events ?? []).map((event) => ({
                  name: event.name,
                  timeUnixNano: dateToNano(event.timestamp),
                  attributes: toOtlpAttributes(event.attributes),
                })),
                status: {
                  code: span.status,
                  message: span.statusMessage || undefined,
                },
              })),
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        logger.error(
          `[OtlpExporter] Export failed: ${res.status} ${res.statusText}`
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[OtlpExporter] Export error: ${msg}`);
    }
  }

  async function flush(): Promise<void> {
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];
    await sendBatch(batch);
  }

  function start(): void {
    if (running) return;
    running = true;
    timer = setInterval(() => {
      flush().catch(() => {});
    }, flushIntervalMs);
  }

  return {
    export(spans: OtlpSpanData[]): void {
      queue.push(...spans);
      if (!running) start();
      if (queue.length >= batchSize) {
        flush().catch(() => {});
      }
    },

    async flush(): Promise<void> {
      await flush();
    },

    async shutdown(): Promise<void> {
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      await flush();
    },

    isEnabled(): boolean {
      return true;
    },
  };
}
