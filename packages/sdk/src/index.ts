// Express middleware is a subpath export: @llmops/sdk/express
// Not re-exported here to avoid pulling Node.js built-ins into Workers bundles.
export {
  createLLMOps as llmops,
  type LLMOpsClient,
  type TraceContext,
  type ProviderOptions,
} from './client';
export {
  createLLMOpsSpanExporter,
  type LLMOpsExporterConfig,
  type SpanExporter,
} from './telemetry/exporter';
export {
  createLLMOpsAgentsExporter,
  type LLMOpsAgentsExporterConfig,
  type AgentsTracingExporter,
} from './telemetry/agents-exporter';
export {
  createLLMOpsLangChainClient,
  type LLMOpsLangChainClientConfig,
  type LangChainTracingClient,
} from './telemetry/langchain-client';

// Telemetry store types (runtime stores are subpath exports: @llmops/sdk/store/pg, @llmops/sdk/store/d1)
export type { TelemetryStore } from './telemetry/interface';
export type {
  LLMRequestInsert,
  TraceUpsert,
  SpanInsert,
  SpanEventInsert,
} from './telemetry/types';
export { COST_SUMMARY_GROUP_BY, type CostSummaryGroupBy } from './telemetry/constants';

// Telemetry spine contracts (from @llmops/core). Producers (the gateway, evals)
// emit through TelemetrySink; the dashboard and dataset-bridge read through
// TelemetryReader. NB: core also defines TelemetryStore = Sink & Reader; the
// concrete store interface above will converge onto it when the stores are
// reworked (see DESIGN.md, step 3).
export type {
  TelemetrySink,
  TelemetryEvent,
  TelemetryReader,
  LLMRequestRecord,
  SpanRecord,
  TraceRecord,
  TokenUsage,
} from '@llmops/core';
