import { z } from 'zod';
import type { InlineProvidersConfig } from '../providers';
import { mergeWithDefaultProviders } from '../providers';

/**
 * Schema for inline provider configuration
 */
const inlineProviderConfigSchema = z
  .object({
    provider: z.string().min(1, 'Provider is required'),
    slug: z.string().min(1, 'Slug is required'),
    apiKey: z.string().optional(),
    customHost: z.string().optional(),
    requestTimeout: z.number().optional(),
    forwardHeaders: z.array(z.string()).optional(),
  })
  .passthrough(); // Allow provider-specific fields

/**
 * Schema for providers array
 */
const providersConfigSchema = z.array(inlineProviderConfigSchema).optional();

/**
 * Base schema without refinements (used for transform)
 */
const llmopsConfigBaseSchema = z.object({
  /**
   * Telemetry store(s) for recording LLM requests, traces, and spans.
   * Pass a single store or an array of stores/sinks.
   *
   * Example:
   * ```ts
   * import { llmops, pgStore } from '@llmops/sdk'
   * const ops = llmops({ telemetry: pgStore(process.env.DATABASE_URL) })
   * ```
   */
  telemetry: z.any().optional(),
  /**
   * Background work handler for edge runtimes (Cloudflare Workers, Vercel Edge).
   * Pass `ctx.waitUntil.bind(ctx)` to ensure telemetry flushes complete
   * after the response is returned.
   *
   * Not needed in Node.js — batching uses setInterval by default.
   */
  waitUntil: z.any().optional(),
  basePath: z
    .string()
    .min(1, 'Base path cannot be empty')
    .refine(
      (path) => path.startsWith('/'),
      'Base path must start with a forward slash',
    )
    .default('/llmops'),
  /**
   * Inline provider configurations.
   * Each provider has a unique slug for routing via @slug/model format.
   * Code-configured providers take precedence over database providers.
   *
   * If not specified, providers are auto-detected from environment variables:
   * - OPENAI_API_KEY -> @openai/model
   * - ANTHROPIC_API_KEY -> @anthropic/model
   * - GOOGLE_API_KEY -> @google/model
   * - MISTRAL_API_KEY -> @mistral/model
   * - GROQ_API_KEY -> @groq/model
   * - And many more...
   */
  providers: providersConfigSchema,
});

export const llmopsConfigSchema = llmopsConfigBaseSchema
  // Transform: merge user providers with auto-detected defaults from env vars
  .transform((config) => ({
    ...config,
    providers: mergeWithDefaultProviders(
      config.providers as InlineProvidersConfig | undefined,
    ),
  }));

/**
 * Validated LLMOps configuration
 *
 * Note: schema is optional in input but always present after validation
 * Either database or providers must be present (enforced by schema)
 */
export type ValidatedLLMOpsConfig = {
  telemetry?: unknown;
  basePath: string;
  providers?: InlineProvidersConfig;
  waitUntil?: (promise: Promise<unknown>) => void;
};

/**
 * Input type for LLMOps configuration (before validation)
 */
export type LLMOpsConfigInput = {
  telemetry?: unknown;
  basePath?: string;
  providers?: InlineProvidersConfig;
  waitUntil?: (promise: Promise<unknown>) => void;
};

export function validateLLMOpsConfig(config?: unknown): ValidatedLLMOpsConfig {
  const result = llmopsConfigSchema.safeParse(config ?? {});

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `LLMOps configuration validation failed:\n${errorMessages}`,
    );
  }

  return result.data;
}
