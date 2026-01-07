import { z } from 'zod';

export const llmopsConfigSchema = z.object({
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
});

/**
 * Validated LLMOps configuration
 *
 * Note: schema is optional in input but always present after validation
 */
export type ValidatedLLMOpsConfig = Omit<
  z.infer<typeof llmopsConfigSchema>,
  'schema'
> & {
  schema: string;
};

/**
 * Input type for LLMOps configuration (before validation)
 * Users can omit optional fields like schema
 */
export type LLMOpsConfigInput = Omit<ValidatedLLMOpsConfig, 'schema'> & {
  schema?: string;
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
