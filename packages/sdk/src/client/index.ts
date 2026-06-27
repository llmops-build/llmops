import {
  type LLMOpsConfig,
  type ValidatedLLMOpsConfig,
  LLMOPS_TRACE_ID_HEADER,
  LLMOPS_TRACE_NAME_HEADER,
  LLMOPS_SPAN_NAME_HEADER,
  LLMOPS_INTERNAL_HEADER,
} from '@llmops/core';
import { createApp } from '@llmops/app';
import {
  createLLMOpsAgentsExporter,
  type AgentsTracingExporter,
} from '../telemetry/agents-exporter';
import {
  createLLMOpsLangChainClient,
  type LangChainTracingClient,
} from '../telemetry/langchain-client';
import { createStoreSink } from '../telemetry/store-sink';
import { noopSink, observe, type Observation } from '../telemetry/observe';
import type { TelemetrySink } from '@llmops/core';
import type { TelemetryStore } from '../telemetry/interface';

export type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  fetch: typeof globalThis.fetch;
};

export type TraceContext = {
  traceId?: string;
  spanName?: string;
  traceName?: string;
};

export type ProviderOptions = {
  traceContext?: () => TraceContext | null;
};

function resolveTelemetryStore(telemetry: unknown) {
  if (!telemetry) return null;
  if (Array.isArray(telemetry)) return telemetry[0] ?? null;
  return telemetry;
}

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: ValidatedLLMOpsConfig;
  provider: (options?: ProviderOptions) => ProviderConfig;
  agentsExporter: () => AgentsTracingExporter;
  langchainTracer: () => LangChainTracingClient;
  telemetry: TelemetrySink;
  observe: (params: {
    provider: string;
    model: string;
    traceId?: string;
    tags?: Record<string, string>;
  }) => Observation;
};

export const createLLMOps = (config?: LLMOpsConfig): LLMOpsClient => {
  const { app, config: validatedConfig } = createApp(config);
  const handler = async (req: Request) => app.fetch(req, undefined, undefined);
  const basePath = validatedConfig.basePath;

  // Build telemetry sink from configured store (headless — works without the HTTP app)
  const store = resolveTelemetryStore(validatedConfig.telemetry);
  const sink = store
    ? createStoreSink(store as TelemetryStore, {
        flushIntervalMs: 2000,
      })
    : noopSink;

  const createInternalFetch = (
    getTraceContext?: () => TraceContext | null,
  ): typeof globalThis.fetch => {
    return (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);

      // Strip basePath — same as what all middleware adapters do
      if (basePath && basePath !== '/' && url.pathname.startsWith(basePath)) {
        url.pathname = url.pathname.slice(basePath.length) || '/';
      }

      // Mark as internal request so the gateway skips duplicate trace creation
      const headers = new Headers(request.headers);
      headers.set(LLMOPS_INTERNAL_HEADER, '1');

      // Inject trace context headers if a provider is configured
      if (getTraceContext) {
        const ctx = getTraceContext();
        if (ctx) {
          if (ctx.traceId) {
            headers.set(LLMOPS_TRACE_ID_HEADER, ctx.traceId);
          }
          if (ctx.traceName) {
            headers.set(LLMOPS_TRACE_NAME_HEADER, ctx.traceName);
          }
          if (ctx.spanName) {
            headers.set(LLMOPS_SPAN_NAME_HEADER, ctx.spanName);
          }
        }
      }

      return handler(
        new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body,
          duplex: 'half',
        } as RequestInit),
      );
    };
  };

  return {
    handler,
    config: Object.freeze(validatedConfig),
    provider: (options?: ProviderOptions) => ({
      baseURL: `http://localhost${basePath}/api/genai/v1`,
      apiKey: 'llmops',
      fetch: createInternalFetch(options?.traceContext),
    }),
    agentsExporter: () =>
      createLLMOpsAgentsExporter({
        baseURL: `http://localhost${basePath}`,
        apiKey: 'llmops',
        fetch: createInternalFetch(),
      }),
    langchainTracer: () =>
      createLLMOpsLangChainClient({
        baseURL: `http://localhost${basePath}`,
        apiKey: 'llmops',
        fetch: createInternalFetch(),
      }),
    telemetry: sink,
    observe: (params) => observe(sink, params),
  };
};
