import type {
  LLMRequestRecord,
  ModelPricing,
  TelemetrySink,
  TokenUsage,
} from '@llmops/core';

export interface InstrumentContext {
  telemetry: TelemetrySink;
  getModelPricing?: (
    provider: string,
    model: string,
  ) => Promise<ModelPricing | null>;
  waitUntil?: (promise: Promise<unknown>) => void;
  requestId: string;
  provider: string;
  model: string;
  input: unknown;
  startedAt: string;
  startMs: number;
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
      emit(ctx, undefined, undefined, 'error', `upstream ${upstream.status}`),
    );
    return upstream;
  }

  const contentType = upstream.headers.get('content-type') ?? '';

  // Streaming: tee — one branch to the caller now, the other drained for usage.
  if (contentType.includes('text/event-stream') && upstream.body) {
    const [toCaller, toMeter] = upstream.body.tee();
    schedule(ctx, meterStream(ctx, toMeter));
    return new Response(toCaller, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    });
  }

  // Non-streaming JSON: parse usage off a clone.
  if (contentType.includes('application/json')) {
    schedule(ctx, meterJson(ctx, upstream.clone()));
    return upstream;
  }

  // Multipart / binary (audio, images) — not instrumentable; pass through.
  return upstream;
}

function schedule(ctx: InstrumentContext, work: Promise<unknown>): void {
  const done = work.catch(() => {});
  ctx.waitUntil?.(done);
}

async function meterJson(
  ctx: InstrumentContext,
  cloned: Response,
): Promise<void> {
  const body = (await cloned.json()) as {
    usage?: OpenAIUsage;
    choices?: Array<{ message?: unknown }>;
  };
  await emit(
    ctx,
    toTokenUsage(body.usage),
    body.choices?.[0]?.message,
    'success',
  );
}

async function meterStream(
  ctx: InstrumentContext,
  stream: ReadableStream<Uint8Array>,
): Promise<void> {
  await emit(ctx, await drainSSEUsage(stream), undefined, 'success');
}

async function emit(
  ctx: InstrumentContext,
  usage: TokenUsage | undefined,
  output: unknown,
  status: 'success' | 'error',
  error?: string,
): Promise<void> {
  const request: LLMRequestRecord = {
    requestId: ctx.requestId,
    provider: ctx.provider,
    model: ctx.model,
    input: ctx.input,
    output: output ?? null,
    usage,
    cost: usage ? await computeCostDollars(ctx, usage) : undefined,
    latencyMs: Date.now() - ctx.startMs,
    status,
    error,
    startedAt: ctx.startedAt,
  };
  ctx.telemetry.emit([{ type: 'llm_request', request }]);
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
  const pricing = await ctx.getModelPricing(ctx.provider, ctx.model);
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
  prompt_tokens_details?: { cached_tokens?: number };
}

function toTokenUsage(u: OpenAIUsage | undefined): TokenUsage | undefined {
  if (!u) return undefined;
  return {
    inputTokens: u.prompt_tokens,
    outputTokens: u.completion_tokens,
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
