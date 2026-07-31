import type {
  LLMRequestRecord,
  ModelPricing,
  SpanRecord,
  TelemetrySink,
  TokenUsage,
  TraceRecord,
} from '@llmops/core';
import {
  applyTraceHeaders,
  type GatewayTraceContext,
} from './trace-context';
import { RequestType } from './types/requests';

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
  const body = (await cloned.json()) as {
    usage?: OpenAIUsage;
    choices?: Array<{ message?: unknown }>;
    data?: Array<{
      b64_json?: string;
      url?: string;
      revised_prompt?: string;
    }>;
  };
  await emit(
    ctx,
    toTokenUsage(body.usage),
    extractJsonOutput(body),
    'success',
    statusCode,
  );
}

function extractJsonOutput(body: {
  choices?: Array<{ message?: unknown }>;
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
}): unknown {
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

async function meterStream(
  ctx: InstrumentContext,
  stream: ReadableStream<Uint8Array>,
  statusCode: number,
): Promise<void> {
  await emit(
    ctx,
    await drainSSEUsage(stream),
    undefined,
    'success',
    statusCode,
  );
}

async function emit(
  ctx: InstrumentContext,
  usage: TokenUsage | undefined,
  output: unknown,
  status: 'success' | 'error',
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
    attributes: {
      'gen_ai.operation.name': operationName(ctx.requestType),
      'gen_ai.provider.name': ctx.provider,
      'gen_ai.request.model': ctx.model,
      'gen_ai.request.endpoint': ctx.requestType,
      'llmops.request.id': ctx.requestId,
      'llmops.is_streaming': ctx.isStreaming,
    },
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
interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

function toTokenUsage(u: OpenAIUsage | undefined): TokenUsage | undefined {
  if (!u) return undefined;
  const inputTokens = u.prompt_tokens ?? 0;
  const outputTokens = Math.max(
    u.completion_tokens ?? 0,
    (u.total_tokens ?? 0) - inputTokens,
  );
  return {
    inputTokens,
    outputTokens,
    cacheReadTokens: u.prompt_tokens_details?.cached_tokens,
  };
}

/**
 * Drain an OpenAI SSE stream and return usage from the terminal chunk (present
 * when `stream_options.include_usage` was set). Frames are `\n\n`-delimited.
 */
async function drainSSEUsage(
  stream: ReadableStream<Uint8Array>,
): Promise<TokenUsage | undefined> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usage: TokenUsage | undefined;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep = buffer.indexOf('\n\n');
      while (sep !== -1) {
        const found = parseUsageFrame(buffer.slice(0, sep));
        if (found) usage = found;
        buffer = buffer.slice(sep + 2);
        sep = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
  return usage;
}

function parseUsageFrame(frame: string): TokenUsage | undefined {
  for (const line of frame.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (data === '' || data === '[DONE]') continue;
    try {
      const json = JSON.parse(data) as { usage?: OpenAIUsage };
      if (json.usage) return toTokenUsage(json.usage);
    } catch {
      // not JSON — skip
    }
  }
  return undefined;
}
