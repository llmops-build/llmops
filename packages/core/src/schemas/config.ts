import { SupportedProviders } from '@/providers';
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
 * Build a partial object schema from SupportedProviders enum
 * Each provider key is optional, allowing users to configure only the providers they need
 */
const providerEntries = Object.values(SupportedProviders).map(
  (provider) => [provider, providerConfigSchema.optional()] as const
);

const providersObjectSchema = z.object(
  Object.fromEntries(providerEntries) as {
    [K in SupportedProviders]: z.ZodOptional<typeof providerConfigSchema>;
  }
);

/**
 * Providers configuration - maps supported provider names to their configs
 * All providers are optional, but at least one must be configured
 */
const providersSchema = providersObjectSchema.refine(
  (providers) =>
    Object.values(providers).some((v) => v !== undefined && v !== null),
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
