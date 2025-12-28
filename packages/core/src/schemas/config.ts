import { z } from 'zod';

/**
 * Provider configuration schema
 *
 * This is a flexible schema that allows any provider configuration.
 * The actual provider validation happens at the gateway level.
 */
const providerConfigSchema = z
  .object({
    apiKey: z.string().min(1, 'API key is required'),
    customHost: z.string().optional(),
  })
  .passthrough(); // Allow additional provider-specific options

/**
 * Providers configuration - maps provider names to their configs
 */
const providersSchema = z
  .record(z.string(), providerConfigSchema)
  .refine(
    (providers) => Object.keys(providers).length > 0,
    'At least one provider must be configured'
  );

const authSchema = z.object({
  type: z.literal('basic'),
  defaultUser: z.string(),
  defaultPassword: z.string(),
});

export const llmopsConfigSchema = z.object({
  database: z.any(),
  auth: authSchema,
  basePath: z
    .string()
    .min(1, 'Base path is required and cannot be empty')
    .refine(
      (path) => path.startsWith('/'),
      'Base path must start with a forward slash'
    ),
  providers: providersSchema,
});

export type ValidatedLLMOpsConfig = z.infer<typeof llmopsConfigSchema>;

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
