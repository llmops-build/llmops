import z from 'zod';

// ─── Guardrail schemas ──────────────────────────────────────────────────────

export const guardrailResultSchema = z.object({
  checkId: z.string(),
  functionId: z.string(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  verdict: z.boolean(),
  latencyMs: z.number(),
});

export const guardrailResultsSchema = z.object({
  results: z.array(guardrailResultSchema),
  action: z.enum(['allowed', 'blocked', 'logged']),
  totalLatencyMs: z.number(),
});

// ─── LLM Request insert schema ─────────────────────────────────────────────

export const insertLLMRequestSchema = z.object({
  requestId: z.string().uuid(),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0),
  cacheCreationTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  cacheSavings: z.number().int().default(0),
  inputCost: z.number().int().default(0),
  outputCost: z.number().int().default(0),
  endpoint: z.string(),
  statusCode: z.number().int(),
  latencyMs: z.number().int().default(0),
  isStreaming: z.boolean().default(false),
  userId: z.string().nullable().optional(),
  tags: z.record(z.string(), z.string()).default({}),
  guardrailResults: guardrailResultsSchema.nullable().optional(),
  traceId: z.string().nullable().optional(),
  spanId: z.string().nullable().optional(),
  parentSpanId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
});

export type LLMRequestInsert = z.infer<typeof insertLLMRequestSchema>;

// ─── Cost summary ───────────────────────────────────────────────────────────

export { COST_SUMMARY_GROUP_BY, type CostSummaryGroupBy } from './constants';

// ─── Trace schemas ──────────────────────────────────────────────────────────

export const upsertTraceSchema = z.object({
  traceId: z.string(),
  name: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  status: z.enum(['unset', 'ok', 'error']).default('unset'),
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  spanCount: z.number().int().default(1),
  totalInputTokens: z.number().int().default(0),
  totalOutputTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  totalCost: z.number().int().default(0),
  tags: z.record(z.string(), z.string()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type TraceUpsert = z.infer<typeof upsertTraceSchema>;

// ─── Span schemas ───────────────────────────────────────────────────────────

export const insertSpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().nullable().optional(),
  name: z.string(),
  kind: z.number().int().default(1),
  status: z.number().int().default(0),
  statusMessage: z.string().nullable().optional(),
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  provider: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
  requestId: z.string().uuid().nullable().optional(),
  source: z.enum(['gateway', 'otlp', 'langsmith']).default('gateway'),
  input: z.unknown().nullable().optional(),
  output: z.unknown().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type SpanInsert = z.infer<typeof insertSpanSchema>;

// ─── Span event schemas ─────────────────────────────────────────────────────

export const insertSpanEventSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  name: z.string(),
  timestamp: z.date(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type SpanEventInsert = z.infer<typeof insertSpanEventSchema>;
