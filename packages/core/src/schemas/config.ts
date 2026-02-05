import { z } from 'zod';
import type { InlineProvidersConfig } from '../providers';

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

export const llmopsConfigSchema = z.object({
  /**
   * Database connection for storing configs, variants, etc.
   */
  database: z.any(),
  basePath: z
    .string()
    .min(1, 'Base path is required and cannot be empty')
    .refine(
      (path) => path.startsWith('/'),
      'Base path must start with a forward slash'
    ),
  /**
   * Database schema name for PostgreSQL connections.
   * This sets the search_path on every connection.
   * Defaults to 'llmops'. Set to 'public' to use the default PostgreSQL schema.
   */
  schema: z.string().optional().default('llmops'),
  /**
   * Inline provider configurations.
   * Each provider has a unique slug for routing via @slug/model format.
   * Code-configured providers take precedence over database providers.
   */
  providers: providersConfigSchema,
});

/**
 * Validated LLMOps configuration
 *
 * Note: schema is optional in input but always present after validation
 */
export type ValidatedLLMOpsConfig = {
  database: unknown;
  basePath: string;
  schema: string;
  providers?: InlineProvidersConfig;
};

/**
 * Input type for LLMOps configuration (before validation)
 * Users can omit optional fields like schema and providers
 */
export type LLMOpsConfigInput = {
  database: unknown;
  basePath: string;
  schema?: string;
  providers?: InlineProvidersConfig;
};

export function validateLLMOpsConfig(config: unknown): ValidatedLLMOpsConfig {
  const result = llmopsConfigSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `LLMOps configuration validation failed:\n${errorMessages}`
    );
  }

  return result.data;
}
