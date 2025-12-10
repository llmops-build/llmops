import { z } from 'zod';
import { SupportedProviders } from '../providers';

const openRouterProviderSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'OpenRouter API key is required and cannot be empty'),
});

const providersSchema = z.object({
  [SupportedProviders.OPENROUTER]: openRouterProviderSchema.optional(),
});

export const llmopsConfigSchema = z.object({
  database: z.any(),
  basePath: z
    .string()
    .min(1, 'Base path is required and cannot be empty')
    .refine(
      (path) => path.startsWith('/'),
      'Base path must start with a forward slash'
    ),
  providers: providersSchema.refine((providers) => {
    const hasAtLeastOneProvider = Object.values(providers).some(
      (provider) => provider !== undefined
    );
    return hasAtLeastOneProvider;
  }, 'At least one provider must be configured'),
});

export type ValidatedLLMOpsConfig = z.infer<typeof llmopsConfigSchema>;

export function validateLLMOpsConfig(config: unknown): ValidatedLLMOpsConfig {
  const result = llmopsConfigSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `LLMOps configuration validation failed:\n${errorMessages}`
    );
  }

  return result.data;
}
