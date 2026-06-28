import type { LLMOpsClient, ProviderConfig, ProviderOptions } from '../client';

/**
 * Gateway connection config for the OpenAI SDK.
 *
 * ```ts
 * const provider = createOpenAIProvider(ops)
 * const openai = new OpenAI(provider)
 * await openai.chat.completions.create({ model: '@openai/gpt-4o', messages })
 * ```
 *
 * Returns `{ baseURL, apiKey, fetch }` wired to the in-process gateway — pass it
 * straight to `new OpenAI(...)`. For OpenAI (the gateway's native protocol) this
 * is a named pass-through of `ops.provider()`; the per-SDK factory shape is what
 * keeps non-OpenAI SDKs (e.g. Anthropic, with a different base path) clean.
 *
 * Need extra OpenAI client options? Merge them at construction:
 * `new OpenAI({ ...createOpenAIProvider(ops), timeout: 30_000 })`.
 */
export function createOpenAIProvider(
  ops: LLMOpsClient,
  options?: ProviderOptions,
): ProviderConfig {
  return ops.provider(options);
}
