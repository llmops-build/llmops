/**
 * LLMOps Tracing Exporter for @openai/agents
 *
 * Implements the TracingExporter interface from @openai/agents-core, converting
 * the agents framework's Trace/Span format to OTLP JSON and sending it to
 * the LLMOps OTLP ingestion endpoint.
 *
 * No dependency on @openai/agents — types are defined inline using structural
 * compatibility (same pattern as the OTel exporter).
 *
 * @example
 * ```typescript
 * import { createLLMOpsAgentsExporter } from '@llmops/sdk';
 * import { setTraceProcessors, BatchTraceProcessor } from '@openai/agents';
 *
 * const exporter = createLLMOpsAgentsExporter({
 *   baseURL: 'http://localhost:5177',
 *   apiKey: process.env.LLMOPS_API_KEY!,
 * });
 *
 * setTraceProcessors([new BatchTraceProcessor(exporter)]);
 *
 * // All @openai/agents traces now flow to LLMOps automatically
 * ```
 */

// ---------------------------------------------------------------------------
// Minimal types matching @openai/agents interfaces (structural compatibility)
// ---------------------------------------------------------------------------

/** Matches TracingExporter from @openai/agents-core */
export interface AgentsTracingExporter {
  export(
    items: (AgentsTrace | AgentsSpan)[],
    signal?: AbortSignal
  ): Promise<void>;
}

/** Matches Trace from @openai/agents-core */
export interface AgentsTrace {
  type: 'trace';
  traceId: string;
  name: string;
  groupId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Matches SpanError from @openai/agents-core */
export interface AgentsSpanError {
  message: string;
  data?: Record<string, unknown>;
}

/** Matches Span from @openai/agents-core */
export interface AgentsSpan {
  type: 'trace.span';
  spanId: string;
  traceId: string;
  parentId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  error?: AgentsSpanError | null;
  spanData: AgentsSpanData;
}

// --- Span data type variants ---

type AgentSpanData = {
  type: 'agent';
  name: string;
  handoffs?: string[];
  tools?: string[];
  output_type?: string;
};

type FunctionSpanData = {
  type: 'function';
  name: string;
  input: string;
  output: string;
  mcp_data?: string;
};

type GenerationUsageData = {
  input_tokens?: number;
  output_tokens?: number;
  details?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type GenerationSpanData = {
  type: 'generation';
  input?: Record<string, unknown>[];
  output?: Record<string, unknown>[];
  model?: string;
  model_config?: Record<string, unknown>;
  usage?: GenerationUsageData;
};

type ResponseSpanData = {
  type: 'response';
  response_id?: string;
  [key: string]: unknown;
};

type HandoffSpanData = {
  type: 'handoff';
  from_agent?: string;
  to_agent?: string;
};

type CustomSpanData = {
  type: 'custom';
  name: string;
  data: Record<string, unknown>;
};

type GuardrailSpanData = {
  type: 'guardrail';
  name: string;
  triggered: boolean;
};

type TranscriptionSpanData = {
  type: 'transcription';
  input: unknown;
  output?: string;
  model?: string;
  model_config?: Record<string, unknown>;
};

type SpeechSpanData = {
  type: 'speech';
  input?: string;
  output: unknown;
  model?: string;
  model_config?: Record<string, unknown>;
};

type SpeechGroupSpanData = {
  type: 'speech_group';
  input?: string;
};

type MCPListToolsSpanData = {
  type: 'mcp_tools';
  server?: string;
  result?: string[];
};

export type AgentsSpanData =
  | AgentSpanData
  | FunctionSpanData
  | GenerationSpanData
  | ResponseSpanData
  | HandoffSpanData
  | CustomSpanData
  | GuardrailSpanData
  | TranscriptionSpanData
  | SpeechSpanData
  | SpeechGroupSpanData
  | MCPListToolsSpanData;

// ---------------------------------------------------------------------------
// OTLP types (minimal, matching what our endpoint expects)
// ---------------------------------------------------------------------------

type OtlpKeyValue = { key: string; value: Record<string, unknown> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTraceId(id: string): string {
  return id.startsWith('trace_') ? id.slice(6) : id;
}

function normalizeSpanId(id: string): string {
  return id.startsWith('span_') ? id.slice(5) : id;
}

function isoToNano(iso: string | null | undefined): string {
  if (!iso) return '0';
  const ms = new Date(iso).getTime();
  if (isNaN(ms)) return '0';
  return (BigInt(ms) * BigInt(1_000_000)).toString();
}

function toOtlpValue(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { intValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') return { boolValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => toOtlpValue(v)) } };
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

function kv(key: string, value: unknown): OtlpKeyValue {
  return { key, value: toOtlpValue(value) };
}

/**
 * Derive a human-readable span name from the span data type.
 */
function deriveSpanName(data: AgentsSpanData): string {
  switch (data.type) {
    case 'agent':
      return `Agent: ${data.name}`;
    case 'function':
      return `Tool: ${data.name}`;
    case 'generation':
      return data.model ? `Generation: ${data.model}` : 'Generation';
    case 'response':
      return 'Response';
    case 'handoff':
      return `Handoff: ${data.from_agent ?? '?'} → ${data.to_agent ?? '?'}`;
    case 'guardrail':
      return `Guardrail: ${data.name}`;
    case 'custom':
      return `Custom: ${data.name}`;
    case 'transcription':
      return data.model ? `Transcription: ${data.model}` : 'Transcription';
    case 'speech':
      return data.model ? `Speech: ${data.model}` : 'Speech';
    case 'speech_group':
      return 'Speech Group';
    case 'mcp_tools':
      return `MCP Tools: ${data.server ?? 'unknown'}`;
    default:
      return 'Unknown Span';
  }
}

/**
 * Convert span data fields to OTLP attributes that our UI's getSpanType() recognizes.
 */
function convertSpanDataToAttributes(
  data: AgentsSpanData,
  error?: AgentsSpanError | null
): OtlpKeyValue[] {
  const attrs: OtlpKeyValue[] = [
    kv('openai.agents.span_type', data.type),
  ];

  switch (data.type) {
    case 'generation':
      attrs.push(kv('gen_ai.operation.name', 'chat'));
      if (data.model) {
        attrs.push(kv('gen_ai.request.model', data.model));
        attrs.push(kv('gen_ai.system', 'openai'));
      }
      if (data.usage?.input_tokens != null) {
        attrs.push(kv('gen_ai.usage.input_tokens', data.usage.input_tokens));
      }
      if (data.usage?.output_tokens != null) {
        attrs.push(kv('gen_ai.usage.output_tokens', data.usage.output_tokens));
      }
      if (data.input) {
        attrs.push(kv('ai.prompt.messages', JSON.stringify(data.input)));
      }
      if (data.output) {
        attrs.push(kv('gen_ai.completion', JSON.stringify(data.output)));
      }
      if (data.model_config) {
        attrs.push(
          kv('gen_ai.request.model_config', JSON.stringify(data.model_config))
        );
      }
      break;

    case 'agent':
      attrs.push(kv('openai.agents.agent.name', data.name));
      if (data.tools?.length) {
        attrs.push(kv('openai.agents.agent.tools', JSON.stringify(data.tools)));
      }
      if (data.handoffs?.length) {
        attrs.push(
          kv('openai.agents.agent.handoffs', JSON.stringify(data.handoffs))
        );
      }
      if (data.output_type) {
        attrs.push(kv('openai.agents.agent.output_type', data.output_type));
      }
      break;

    case 'function':
      attrs.push(kv('gen_ai.tool.name', data.name));
      if (data.input) {
        attrs.push(kv('ai.prompt.messages', data.input));
      }
      if (data.output) {
        attrs.push(kv('ai.response.text', data.output));
      }
      if (data.mcp_data) {
        attrs.push(kv('openai.agents.function.mcp_data', data.mcp_data));
      }
      break;

    case 'handoff':
      if (data.from_agent) {
        attrs.push(kv('openai.agents.handoff.from_agent', data.from_agent));
      }
      if (data.to_agent) {
        attrs.push(kv('openai.agents.handoff.to_agent', data.to_agent));
      }
      break;

    case 'guardrail':
      attrs.push(
        kv('llmops.guardrail.action', data.triggered ? 'triggered' : 'passed')
      );
      attrs.push(kv('openai.agents.guardrail.name', data.name));
      break;

    case 'response':
      attrs.push(kv('gen_ai.operation.name', 'chat'));
      if (data.response_id) {
        attrs.push(kv('openai.agents.response.id', data.response_id));
      }
      break;

    case 'custom':
      attrs.push(kv('openai.agents.custom.name', data.name));
      attrs.push(kv('openai.agents.custom.data', JSON.stringify(data.data)));
      break;

    case 'transcription':
      attrs.push(kv('gen_ai.operation.name', 'transcription'));
      if (data.model) {
        attrs.push(kv('gen_ai.request.model', data.model));
      }
      if (data.output) {
        attrs.push(kv('ai.response.text', data.output));
      }
      break;

    case 'speech':
      attrs.push(kv('gen_ai.operation.name', 'speech'));
      if (data.model) {
        attrs.push(kv('gen_ai.request.model', data.model));
      }
      if (data.input) {
        attrs.push(kv('ai.prompt.messages', data.input));
      }
      break;

    case 'speech_group':
      if (data.input) {
        attrs.push(kv('openai.agents.speech_group.input', data.input));
      }
      break;

    case 'mcp_tools':
      attrs.push(
        kv('gen_ai.tool.name', `mcp:${data.server ?? 'unknown'}`)
      );
      if (data.result) {
        attrs.push(
          kv('openai.agents.mcp.tools', JSON.stringify(data.result))
        );
      }
      break;
  }

  if (error) {
    attrs.push(kv('error.message', error.message));
    if (error.data) {
      attrs.push(kv('error.data', JSON.stringify(error.data)));
    }
  }

  return attrs;
}

// ---------------------------------------------------------------------------
// OTLP builder
// ---------------------------------------------------------------------------

function buildResourceSpans(
  traceId: string,
  trace: AgentsTrace | undefined,
  spans: AgentsSpan[]
) {
  const resourceAttrs: OtlpKeyValue[] = [
    kv('service.name', '@openai/agents'),
  ];

  if (trace) {
    resourceAttrs.push(kv('openai.agents.trace.name', trace.name));
    if (trace.groupId) {
      resourceAttrs.push(kv('openai.agents.trace.group_id', trace.groupId));
    }
    if (trace.metadata && Object.keys(trace.metadata).length > 0) {
      resourceAttrs.push(
        kv('openai.agents.trace.metadata', JSON.stringify(trace.metadata))
      );
    }
  }

  const normalizedTraceId = normalizeTraceId(traceId);

  return {
    resource: { attributes: resourceAttrs },
    scopeSpans: [
      {
        scope: { name: '@llmops/agents-exporter' },
        spans: spans.map((span) => {
          const isError = !!span.error;
          return {
            traceId: normalizedTraceId,
            spanId: normalizeSpanId(span.spanId),
            parentSpanId: span.parentId
              ? normalizeSpanId(span.parentId)
              : undefined,
            name: deriveSpanName(span.spanData),
            kind: 1, // INTERNAL
            startTimeUnixNano: isoToNano(span.startedAt),
            endTimeUnixNano: isoToNano(span.endedAt),
            attributes: convertSpanDataToAttributes(span.spanData, span.error),
            events: [],
            status: isError
              ? { code: 2, message: span.error!.message }
              : { code: 1 },
          };
        }),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface LLMOpsAgentsExporterConfig {
  /** LLMOps server base URL (e.g. http://localhost:5177) */
  baseURL: string;
  /** Environment secret or API key for authentication */
  apiKey: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Create a TracingExporter for @openai/agents that sends traces to LLMOps.
 *
 * Usage:
 * ```typescript
 * import { createLLMOpsAgentsExporter } from '@llmops/sdk';
 * import { setTraceProcessors, BatchTraceProcessor } from '@openai/agents';
 *
 * setTraceProcessors([
 *   new BatchTraceProcessor(createLLMOpsAgentsExporter({
 *     baseURL: 'http://localhost:5177',
 *     apiKey: process.env.LLMOPS_API_KEY!,
 *   }))
 * ]);
 * ```
 */
export function createLLMOpsAgentsExporter(
  config: LLMOpsAgentsExporterConfig
): AgentsTracingExporter {
  const url = `${config.baseURL.replace(/\/$/, '')}/api/otlp/v1/traces`;

  return {
    async export(
      items: (AgentsTrace | AgentsSpan)[],
      signal?: AbortSignal
    ): Promise<void> {
      const traces: AgentsTrace[] = [];
      const spans: AgentsSpan[] = [];

      for (const item of items) {
        if (item.type === 'trace') {
          traces.push(item as AgentsTrace);
        } else {
          spans.push(item as AgentsSpan);
        }
      }

      // Skip if no spans — traces get created implicitly via upsertTrace
      // when the first span arrives
      if (spans.length === 0) return;

      // Build trace lookup for metadata
      const traceMap = new Map<string, AgentsTrace>();
      for (const t of traces) {
        traceMap.set(t.traceId, t);
      }

      // Group spans by traceId
      const spansByTrace = new Map<string, AgentsSpan[]>();
      for (const s of spans) {
        const group = spansByTrace.get(s.traceId) ?? [];
        group.push(s);
        spansByTrace.set(s.traceId, group);
      }

      // Build OTLP payload
      const resourceSpans = [];
      for (const [traceId, traceSpans] of spansByTrace) {
        const trace = traceMap.get(traceId);
        resourceSpans.push(buildResourceSpans(traceId, trace, traceSpans));
      }

      if (resourceSpans.length === 0) return;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          ...(config.headers ?? {}),
        },
        body: JSON.stringify({ resourceSpans }),
        signal,
      });
    },
  };
}
