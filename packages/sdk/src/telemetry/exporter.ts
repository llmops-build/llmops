/**
 * LLMOps OTLP Span Exporter
 *
 * A lightweight OTel SpanExporter that sends spans to the LLMOps server's
 * OTLP ingestion endpoint. Compatible with OpenTelemetry SDK.
 *
 * @example
 * ```typescript
 * import { createLLMOpsSpanExporter } from '@llmops/sdk/telemetry';
 * import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
 *
 * const provider = new NodeTracerProvider();
 * provider.addSpanProcessor(
 *   new SimpleSpanProcessor(createLLMOpsSpanExporter({
 *     baseURL: process.env.LLMOPS_URL,
 *     apiKey: process.env.LLMOPS_API_KEY,
 *   }))
 * );
 * provider.register();
 *
 * // Now Vercel AI SDK spans automatically flow to LLMOps
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'Hello',
 *   experimental_telemetry: { isEnabled: true },
 * });
 * ```
 */

/**
 * Minimal OTel SpanExporter interface
 * We don't depend on @opentelemetry/sdk-trace-base — just implement the interface
 */
export interface SpanExporter {
  export(
    spans: ReadonlyArray<ReadableSpan>,
    resultCallback: (result: ExportResult) => void
  ): void;
  shutdown(): Promise<void>;
  forceFlush?(): Promise<void>;
}

/** Subset of OTel ReadableSpan we consume */
export interface ReadableSpan {
  readonly spanContext: () => {
    traceId: string;
    spanId: string;
    traceFlags: number;
  };
  readonly parentSpanId?: string;
  readonly name: string;
  readonly kind: number;
  readonly startTime: [number, number]; // [seconds, nanoseconds]
  readonly endTime: [number, number];
  readonly status: { code: number; message?: string };
  readonly attributes: Record<string, unknown>;
  readonly events: ReadonlyArray<{
    name: string;
    time: [number, number];
    attributes?: Record<string, unknown>;
  }>;
  readonly resource: {
    attributes: Record<string, unknown>;
  };
  readonly instrumentationLibrary: {
    name: string;
    version?: string;
  };
}

export interface ExportResult {
  code: ExportResultCode;
  error?: Error;
}

export enum ExportResultCode {
  SUCCESS = 0,
  FAILED = 1,
}

export interface LLMOpsExporterConfig {
  /** LLMOps server base URL (e.g. http://localhost:3000) */
  baseURL: string;
  /** Environment secret or API key for authentication */
  apiKey: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
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
 * Convert HrTime [seconds, nanoseconds] to nanosecond string
 */
function hrTimeToNano(hrTime: [number, number]): string {
  const nanos = BigInt(hrTime[0]) * BigInt(1_000_000_000) + BigInt(hrTime[1]);
  return nanos.toString();
}

/**
 * Create an OTel SpanExporter that sends spans to an LLMOps server.
 */
export function createLLMOpsSpanExporter(
  config: LLMOpsExporterConfig
): SpanExporter {
  const url = `${config.baseURL.replace(/\/$/, '')}/api/otlp/v1/traces`;

  return {
    export(
      spans: ReadonlyArray<ReadableSpan>,
      resultCallback: (result: ExportResult) => void
    ): void {
      // Group spans by resource
      const resourceMap = new Map<string, ReadableSpan[]>();
      for (const span of spans) {
        const resourceKey = JSON.stringify(span.resource.attributes);
        const group = resourceMap.get(resourceKey) ?? [];
        group.push(span);
        resourceMap.set(resourceKey, group);
      }

      const resourceSpans = Array.from(resourceMap.entries()).map(
        ([resourceKey, group]) => {
          const resourceAttrs = JSON.parse(resourceKey);

          // Group by instrumentation library
          const scopeMap = new Map<string, ReadableSpan[]>();
          for (const span of group) {
            const scopeKey = `${span.instrumentationLibrary.name}:${span.instrumentationLibrary.version ?? ''}`;
            const scopeGroup = scopeMap.get(scopeKey) ?? [];
            scopeGroup.push(span);
            scopeMap.set(scopeKey, scopeGroup);
          }

          return {
            resource: {
              attributes: Object.entries(resourceAttrs)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([key, value]) => ({
                  key,
                  value: toOtlpValue(value),
                })),
            },
            scopeSpans: Array.from(scopeMap.entries()).map(
              ([, scopeGroup]) => ({
                scope: {
                  name: scopeGroup[0].instrumentationLibrary.name,
                  version:
                    scopeGroup[0].instrumentationLibrary.version ?? undefined,
                },
                spans: scopeGroup.map((span) => {
                  const ctx = span.spanContext();
                  return {
                    traceId: ctx.traceId,
                    spanId: ctx.spanId,
                    parentSpanId: span.parentSpanId || undefined,
                    name: span.name,
                    kind: span.kind,
                    startTimeUnixNano: hrTimeToNano(span.startTime),
                    endTimeUnixNano: hrTimeToNano(span.endTime),
                    attributes: Object.entries(span.attributes)
                      .filter(([, v]) => v !== undefined && v !== null)
                      .map(([key, value]) => ({
                        key,
                        value: toOtlpValue(value),
                      })),
                    events: span.events.map((event) => ({
                      name: event.name,
                      timeUnixNano: hrTimeToNano(event.time),
                      attributes: event.attributes
                        ? Object.entries(event.attributes)
                            .filter(([, v]) => v !== undefined && v !== null)
                            .map(([key, value]) => ({
                              key,
                              value: toOtlpValue(value),
                            }))
                        : [],
                    })),
                    status: {
                      code: span.status.code,
                      message: span.status.message ?? undefined,
                    },
                  };
                }),
              })
            ),
          };
        }
      );

      const body = { resourceSpans };

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          ...(config.headers ?? {}),
        },
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (res.ok) {
            resultCallback({ code: ExportResultCode.SUCCESS });
          } else {
            resultCallback({
              code: ExportResultCode.FAILED,
              error: new Error(`OTLP export failed: ${res.status}`),
            });
          }
        })
        .catch((error) => {
          resultCallback({
            code: ExportResultCode.FAILED,
            error:
              error instanceof Error ? error : new Error(String(error)),
          });
        });
    },

    async shutdown(): Promise<void> {
      // Nothing to clean up
    },

    async forceFlush(): Promise<void> {
      // Nothing buffered
    },
  };
}
