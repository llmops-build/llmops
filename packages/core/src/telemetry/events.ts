/**
 * The telemetry wire format.
 *
 * This is the single source of truth for "what a unit of telemetry looks like".
 * Every PRODUCER (the gateway, evals, manual instrumentation) builds these;
 * every SINK (a store, an OTel forwarder, a Datadog forwarder) consumes them.
 * Because the contract is a plain discriminated union, a producer never learns
 * how a sink persists — and a sink never learns who produced an event.
 *
 * The concrete store insert schemas in `@llmops/sdk` (LLMRequestInsert,
 * SpanInsert, TraceUpsert) will be unified to derive from these records during
 * wiring — see DESIGN.md, "Rollout".
 */

/** Token accounting, shared by requests and spans. */
export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

/** A single LLM call — the unit behind the request log and cost tracking. */
export interface LLMRequestRecord {
  requestId: string;
  /** Set when the call belongs to a trace (e.g. an agent step). */
  traceId?: string;
  spanId?: string;
  provider: string;
  model: string;
  /** Request payload (messages / prompt), provider-shaped. */
  input: unknown;
  /** Response payload (content / choices), provider-shaped. */
  output: unknown;
  usage?: TokenUsage;
  /** Computed cost in USD. */
  cost?: number;
  latencyMs?: number;
  /** Whether the upstream response was delivered as a stream. */
  isStreaming?: boolean;
  /** Gateway endpoint that produced this request (for example `/images/generations`). */
  endpoint?: string;
  /** Actual upstream HTTP status code. */
  statusCode?: number;
  status: 'success' | 'error';
  error?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  /** ISO-8601 timestamp. */
  startedAt: string;
}

/** A node in a trace tree: an agent step, a tool call, a retrieval, an LLM call. */
export interface SpanRecord {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  /** gen_ai semconv kind: 'llm' | 'tool' | 'agent' | 'chain' | 'retrieval' | ... */
  kind?: string;
  input?: unknown;
  output?: unknown;
  usage?: TokenUsage;
  cost?: number;
  status: 'ok' | 'error';
  error?: string;
  attributes?: Record<string, unknown>;
  /** ISO-8601 timestamp. */
  startedAt: string;
  endedAt?: string;
}

/** The root of a trace; rolls up the cost and token totals of its spans. */
export interface TraceRecord {
  traceId: string;
  name: string;
  sessionId?: string;
  userId?: string;
  status?: 'ok' | 'error';
  metadata?: Record<string, unknown>;
  /** ISO-8601 timestamp. */
  startedAt: string;
  endedAt?: string;
}

/**
 * The ONLY thing that crosses the producer→sink boundary.
 *
 * Adding a new kind of telemetry means adding a member here; because it is a
 * discriminated union, every sink is forced by the compiler to handle the new
 * case (or explicitly ignore it). A `span` event may carry its parent `trace`
 * so a sink can upsert both in one shot.
 */
export type TelemetryEvent =
  | { type: 'llm_request'; request: LLMRequestRecord }
  | { type: 'span'; span: SpanRecord; trace?: TraceRecord };
