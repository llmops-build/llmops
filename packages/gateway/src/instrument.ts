import type {
  LLMRequestRecord,
  ModelPricing,
  SpanRecord,
  TelemetrySink,
  TokenUsage,
  TraceRecord,
} from '@llmops/core';
import {
  type OpenAIResponseBody,
  type OpenAIUsage,
  parseOpenAIResponseBody,
  parseSSEEventPayload,
} from './openai-protocol';
import {
  applyTraceHeaders,
  type GatewayTraceContext,
} from './trace-context';
import { RequestType } from './types/requests';

/** The status telemetry records for a metered request — never an arbitrary string. */
type MeteringStatus = 'success' | 'error';

export interface InstrumentContext {
  telemetry: TelemetrySink;
  getModelPricing?: (
    provider: string,
    model: string,
    inputTokens?: number,
  ) => Promise<ModelPricing | null>;
  waitUntil?: (promise: Promise<unknown>) => void;
  requestId: string;
  trace: GatewayTraceContext;
  provider: string;
  model: string;
  input: unknown;
  startedAt: string;
  startMs: number;
  isStreaming: boolean;
  requestType: RequestType;
}

/**
 * Wrap the upstream response so usage + cost are metered off-band and emitted to
 * the telemetry sink with ZERO added latency. The caller always gets the body
 * immediately; parsing happens on a clone (non-streaming) or a tee'd branch
 * (streaming). Metering is best-effort and never throws into the request path.
 */
export function instrumentResponse(
  upstream: Response,
  ctx: InstrumentContext,
): Response {
  if (!upstream.ok) {
    schedule(
      ctx,
      emit(
        ctx,
        undefined,
        undefined,
        'error',
        upstream.status,
        `upstream ${upstream.status}`,
      ),
    );
    return withTraceHeaders(upstream, ctx);
  }

  const contentType = upstream.headers.get('content-type') ?? '';

  // Streaming: tee — one branch to the caller now, the other drained for usage.
  if (contentType.includes('text/event-stream') && upstream.body) {
    const [toCaller, toMeter] = upstream.body.tee();
    schedule(ctx, meterStream(ctx, toMeter, upstream.status));
    return withTraceHeaders(new Response(toCaller, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    }), ctx);
  }

  // Non-streaming JSON: parse usage off a clone.
  if (contentType.includes('application/json')) {
    schedule(ctx, meterJson(ctx, upstream.clone(), upstream.status));
    return withTraceHeaders(upstream, ctx);
  }

  // Multipart / binary (audio, images) — not instrumentable; pass through.
  return withTraceHeaders(upstream, ctx);
}

function withTraceHeaders(response: Response, ctx: InstrumentContext): Response {
  const headers = new Headers(response.headers);
  applyTraceHeaders(headers, ctx.requestId, ctx.trace);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function schedule(ctx: InstrumentContext, work: Promise<unknown>): void {
  const done = work.catch(() => {});
  ctx.waitUntil?.(done);
}

async function meterJson(
  ctx: InstrumentContext,
  cloned: Response,
  statusCode: number,
): Promise<void> {
  const body = parseOpenAIResponseBody(await cloned.json());
  const failed =
    ctx.requestType === RequestType.Responses && body.status === 'failed';
  await emit(
    ctx,
    toTokenUsage(body.usage),
    extractJsonOutput(body),
    toMeteringStatus(failed),
    statusCode,
    failed ? responseErrorMessage(body) : undefined,
  );
}

function toMeteringStatus(failed: boolean): MeteringStatus {
  return failed ? 'error' : 'success';
}

function extractJsonOutput(body: OpenAIResponseBody): unknown {
  if (body.output) {
    return {
      responseId: body.id,
      status: body.status,
      output: sanitizeResponseOutput(body.output),
    };
  }

  const message = body.choices?.[0]?.message;
  if (message !== undefined) return message;
  if (!body.data) return null;

  // Never duplicate large base64 image payloads into telemetry. Preserve only
  // enough metadata for the dashboard to explain what the provider returned.
  return {
    imageCount: body.data.length,
    images: body.data.map((image) => ({
      format: image.b64_json ? 'b64_json' : image.url ? 'url' : 'unknown',
      revisedPrompt: image.revised_prompt,
    })),
  };
}

/** Recursive shape of `sanitizeResponseOutput` — mirrors the sanitized subset of
 * the untyped `output` payload, with binary/opaque fields replaced by markers. */
type SanitizedOutput =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizedOutput[]
  | { [key: string]: SanitizedOutput };

/** Preserve agent/tool linkage while excluding opaque or binary payloads. */
function sanitizeResponseOutput(
  value: unknown,
  parentType?: string,
): SanitizedOutput {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponseOutput(item, parentType));
  }
  if (!value || typeof value !== 'object') return value as SanitizedOutput;

  const source = value as Record<string, unknown>;
  const type = typeof source.type === 'string' ? source.type : parentType;
  const sanitized: Record<string, SanitizedOutput> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (key === 'encrypted_content') continue;
    if (key === 'b64_json' || key === 'screenshot') {
      sanitized[key] = '[binary omitted]';
      continue;
    }
    if (key === 'result' && type === 'image_generation_call') {
      sanitized[key] = '[image omitted]';
      continue;
    }
    sanitized[key] = sanitizeResponseOutput(entry, type);
  }
  return sanitized;
}

function responseErrorMessage(body: OpenAIResponseBody): string {
  return body.error?.message ?? body.error?.code ?? 'response failed';
}

async function meterStream(
  ctx: InstrumentContext,
  stream: ReadableStream<Uint8Array>,
  statusCode: number,
): Promise<void> {
  const metered = await drainSSE(stream);
  await emit(
    ctx,
    metered.usage,
    metered.output,
    metered.status,
    statusCode,
    metered.error,
  );
}

async function emit(
  ctx: InstrumentContext,
  usage: TokenUsage | undefined,
  output: unknown,
  status: MeteringStatus,
  statusCode: number,
  error?: string,
): Promise<void> {
  const endedAt = new Date().toISOString();
  const latencyMs = Date.now() - ctx.startMs;
  const cost = usage ? await computeCostDollars(ctx, usage) : undefined;
  const request: LLMRequestRecord = {
    requestId: ctx.requestId,
    provider: ctx.provider,
    model: ctx.model,
    input: ctx.input,
    output: output ?? null,
    usage,
    cost,
    latencyMs,
    isStreaming: ctx.isStreaming,
    endpoint: ctx.requestType,
    statusCode,
    traceId: ctx.trace.traceId,
    spanId: ctx.trace.spanId,
    status,
    error,
    startedAt: ctx.startedAt,
  };
  const attributes: Record<string, unknown> = {
    'gen_ai.operation.name': operationName(ctx.requestType),
    'gen_ai.provider.name': ctx.provider,
    'gen_ai.request.model': ctx.model,
    'gen_ai.request.endpoint': ctx.requestType,
    'llmops.request.id': ctx.requestId,
    'llmops.is_streaming': ctx.isStreaming,
  };
  if (usage?.inputTokens != null) {
    attributes['gen_ai.usage.input_tokens'] = usage.inputTokens;
  }
  if (usage?.outputTokens != null) {
    attributes['gen_ai.usage.output_tokens'] = usage.outputTokens;
  }
  if (usage?.reasoningTokens != null) {
    attributes['llmops.usage.reasoning_tokens'] = usage.reasoningTokens;
  }

  const span: SpanRecord = {
    traceId: ctx.trace.traceId,
    spanId: ctx.trace.spanId,
    parentSpanId: ctx.trace.parentSpanId,
    name: ctx.trace.spanName ?? `${ctx.provider}/${ctx.model}`,
    kind: 'server',
    input: ctx.input,
    output: output ?? null,
    usage,
    cost,
    status: status === 'success' ? 'ok' : 'error',
    error,
    attributes,
    startedAt: ctx.startedAt,
    endedAt,
  };
  const trace: TraceRecord = {
    traceId: ctx.trace.traceId,
    name: ctx.trace.traceName ?? `${ctx.provider}/${ctx.model}`,
    sessionId: ctx.trace.sessionId,
    userId: ctx.trace.userId,
    status: status === 'success' ? 'ok' : 'error',
    startedAt: ctx.startedAt,
    endedAt,
  };
  ctx.telemetry.emit([
    { type: 'llm_request', request },
    { type: 'span', span, trace },
  ]);
}

function operationName(requestType: RequestType): string {
  switch (requestType) {
    case RequestType.Responses:
      return 'generate_content';
    case RequestType.ImageGeneration:
    case RequestType.ImageEdit:
    case RequestType.ImageVariation:
      return 'image_generation';
    case RequestType.Embedding:
      return 'embeddings';
    case RequestType.AudioSpeech:
      return 'speech';
    case RequestType.AudioTranscription:
    case RequestType.AudioTranslation:
      return 'transcription';
    default:
      return 'chat';
  }
}

/**
 * Cost in DOLLARS (what `LLMRequestRecord.cost` expects — the store re-multiplies
 * to micro-dollars). Model pricing is "dollars per 1M tokens", and
 * tokens × (dollars per 1M) already yields micro-dollars, so divide by 1e6.
 */
async function computeCostDollars(
  ctx: InstrumentContext,
  usage: TokenUsage,
): Promise<number | undefined> {
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  if (input + output === 0 || !ctx.getModelPricing) return undefined;
  const pricing = await ctx.getModelPricing(
    ctx.provider,
    ctx.model,
    usage.inputTokens,
  );
  if (!pricing) return undefined;
  const microDollars =
    input * pricing.inputCostPer1M +
    output * pricing.outputCostPer1M +
    (usage.cacheReadTokens ?? 0) * (pricing.cacheReadCostPer1M ?? 0) +
    (usage.cacheWriteTokens ?? 0) * (pricing.cacheWriteCostPer1M ?? 0);
  return microDollars / 1_000_000;
}

// ── OpenAI usage parsing ────────────────────────────────────────────────────
function toTokenUsage(
  u: OpenAIUsage | null | undefined,
): TokenUsage | undefined {
  if (!u) return undefined;
  const inputTokens = u.input_tokens ?? u.prompt_tokens ?? 0;
  const reportedOutput = u.output_tokens ?? u.completion_tokens ?? 0;
  const outputTokens = Math.max(
    reportedOutput,
    (u.total_tokens ?? 0) - inputTokens,
  );
  return {
    inputTokens,
    outputTokens,
    cacheReadTokens:
      u.input_tokens_details?.cached_tokens ??
      u.prompt_tokens_details?.cached_tokens,
    reasoningTokens: u.output_tokens_details?.reasoning_tokens,
  };
}

/**
 * Drain an OpenAI SSE stream. Chat Completions exposes top-level usage in its
 * terminal chunk; Responses exposes a full response (usage + output items) in
 * the typed `response.completed` event. Frames are `\n\n`-delimited.
 */
interface StreamMeteringResult {
  usage?: TokenUsage;
  output?: unknown;
  status: MeteringStatus;
  error?: string;
}

/** Fold a per-frame metering result into the running stream total. Later
 * frames win — the terminal `response.completed` / usage chunk overrides
 * anything an earlier frame (e.g. a delta) reported. */
function mergeMeteringResult(
  target: StreamMeteringResult,
  found: StreamMeteringResult,
): void {
  if (found.usage) target.usage = found.usage;
  if (found.output !== undefined) target.output = found.output;
  if (found.status === 'error') target.status = 'error';
  if (found.error) target.error = found.error;
}

async function drainSSE(
  stream: ReadableStream<Uint8Array>,
): Promise<StreamMeteringResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const result: StreamMeteringResult = { status: 'success' };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep = buffer.indexOf('\n\n');
      while (sep !== -1) {
        mergeMeteringResult(result, parseMeteringFrame(buffer.slice(0, sep)));
        buffer = buffer.slice(sep + 2);
        sep = buffer.indexOf('\n\n');
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      mergeMeteringResult(result, parseMeteringFrame(buffer));
    }
  } finally {
    reader.releaseLock();
  }
  return result;
}

function parseMeteringFrame(frame: string): StreamMeteringResult {
  const result: StreamMeteringResult = { status: 'success' };
  for (const line of frame.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (data === '' || data === '[DONE]') continue;
    try {
      const json = parseSSEEventPayload(JSON.parse(data));
      const response = json.response;
      const usage = toTokenUsage(response?.usage ?? json.usage);
      if (usage) result.usage = usage;
      if (response?.output) result.output = extractJsonOutput(response);
      if (json.type === 'response.failed' || json.type === 'error') {
        result.status = 'error';
        result.error =
          response?.error?.message ??
          json.error?.message ??
          json.message ??
          'response stream failed';
      }
    } catch {
      // not JSON — skip
    }
  }
  return result;
}
