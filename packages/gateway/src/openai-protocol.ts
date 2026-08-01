/**
 * Untrusted-JSON boundary for OpenAI (and OpenAI-compatible) response bodies.
 *
 * Upstream JSON — whether a non-streaming body or an SSE `data:` payload — is
 * never blindly cast. Every field is narrowed with a runtime guard so a
 * malformed or divergent payload degrades telemetry (missing fields) instead
 * of throwing into the metering path.
 */

export interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  input_tokens_details?: { cached_tokens?: number };
  output_tokens_details?: { reasoning_tokens?: number };
}

export interface OpenAIResponseBody {
  id?: string;
  status?: string;
  error?: { message?: string; code?: string } | null;
  usage?: OpenAIUsage | null;
  choices?: Array<{ message?: unknown }>;
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  output?: unknown[];
}

/** A single parsed `data:` payload from an OpenAI-compatible SSE stream. */
export interface SSEEventPayload {
  type?: string;
  message?: string;
  error?: { message?: string; code?: string };
  usage?: OpenAIUsage;
  response?: OpenAIResponseBody;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function parseErrorField(
  value: unknown,
): { message?: string; code?: string } | undefined {
  if (!isRecord(value)) return undefined;
  return { message: asString(value.message), code: asString(value.code) };
}

function parseChoices(value: unknown): OpenAIResponseBody['choices'] {
  const arr = asArray(value);
  if (!arr) return undefined;
  return arr.map((item) => ({
    message: isRecord(item) ? item.message : undefined,
  }));
}

function parseImageData(value: unknown): OpenAIResponseBody['data'] {
  const arr = asArray(value);
  if (!arr) return undefined;
  return arr.map((item) =>
    isRecord(item)
      ? {
          b64_json: asString(item.b64_json),
          url: asString(item.url),
          revised_prompt: asString(item.revised_prompt),
        }
      : {},
  );
}

/** Narrow an untrusted parsed-JSON value into an `OpenAIUsage`. */
export function parseOpenAIUsage(value: unknown): OpenAIUsage | undefined {
  if (!isRecord(value)) return undefined;
  const promptDetails = value.prompt_tokens_details;
  const inputDetails = value.input_tokens_details;
  const outputDetails = value.output_tokens_details;
  return {
    prompt_tokens: asNumber(value.prompt_tokens),
    completion_tokens: asNumber(value.completion_tokens),
    input_tokens: asNumber(value.input_tokens),
    output_tokens: asNumber(value.output_tokens),
    total_tokens: asNumber(value.total_tokens),
    prompt_tokens_details: isRecord(promptDetails)
      ? { cached_tokens: asNumber(promptDetails.cached_tokens) }
      : undefined,
    input_tokens_details: isRecord(inputDetails)
      ? { cached_tokens: asNumber(inputDetails.cached_tokens) }
      : undefined,
    output_tokens_details: isRecord(outputDetails)
      ? { reasoning_tokens: asNumber(outputDetails.reasoning_tokens) }
      : undefined,
  };
}

/** Narrow an untrusted parsed-JSON value into an `OpenAIResponseBody`. */
export function parseOpenAIResponseBody(value: unknown): OpenAIResponseBody {
  if (!isRecord(value)) return {};
  return {
    id: asString(value.id),
    status: asString(value.status),
    error: value.error === null ? null : parseErrorField(value.error),
    usage: value.usage === null ? null : parseOpenAIUsage(value.usage),
    choices: parseChoices(value.choices),
    data: parseImageData(value.data),
    output: asArray(value.output),
  };
}

/** Narrow an untrusted parsed-JSON SSE `data:` payload into an `SSEEventPayload`. */
export function parseSSEEventPayload(value: unknown): SSEEventPayload {
  if (!isRecord(value)) return {};
  return {
    type: asString(value.type),
    message: asString(value.message),
    error: parseErrorField(value.error),
    usage: parseOpenAIUsage(value.usage),
    response:
      value.response === undefined
        ? undefined
        : parseOpenAIResponseBody(value.response),
  };
}
