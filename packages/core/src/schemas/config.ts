import { z } from 'zod';
import { SupportedProviders } from '../providers';

// Base API key schema used by most providers
const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required and cannot be empty'),
  baseURL: z.string().optional(),
});

// Provider-specific schemas
const openRouterProviderSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'OpenRouter API key is required and cannot be empty'),
});

const openAIProviderSchema = z.object({
  apiKey: z.string().min(1, 'OpenAI API key is required and cannot be empty'),
  organization: z.string().optional(),
  project: z.string().optional(),
  baseURL: z.string().optional(),
});

// const anthropicProviderSchema = apiKeySchema;
// const groqProviderSchema = apiKeySchema;
// const googleProviderSchema = z.object({
//   apiKey: z.string().min(1, 'Google API key is required and cannot be empty'),
// });
// const mistralProviderSchema = apiKeySchema;
// const togetherProviderSchema = apiKeySchema;
// const fireworksProviderSchema = apiKeySchema;
// const deepseekProviderSchema = apiKeySchema;
// const cohereProviderSchema = z.object({
//   apiKey: z.string().min(1, 'Cohere API key is required and cannot be empty'),
// });
// const cerebrasProviderSchema = apiKeySchema;
// const perplexityProviderSchema = apiKeySchema;

const providersSchema = z.object({
  [SupportedProviders.OPENROUTER]: openRouterProviderSchema.optional(),
  [SupportedProviders.OPENAI]: openAIProviderSchema.optional(),
  // [SupportedProviders.ANTHROPIC]: anthropicProviderSchema.optional(),
  // [SupportedProviders.GROQ]: groqProviderSchema.optional(),
  // [SupportedProviders.GOOGLE]: googleProviderSchema.optional(),
  // [SupportedProviders.MISTRAL_AI]: mistralProviderSchema.optional(),
  // [SupportedProviders.TOGETHER_AI]: togetherProviderSchema.optional(),
  // [SupportedProviders.FIREWORKS_AI]: fireworksProviderSchema.optional(),
  // [SupportedProviders.DEEPSEEK]: deepseekProviderSchema.optional(),
  // [SupportedProviders.COHERE]: cohereProviderSchema.optional(),
  // [SupportedProviders.CEREBRAS]: cerebrasProviderSchema.optional(),
  // [SupportedProviders.PERPLEXITY_AI]: perplexityProviderSchema.optional(),
});

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
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `LLMOps configuration validation failed:\n${errorMessages}`
    );
  }

  return result.data;
}
