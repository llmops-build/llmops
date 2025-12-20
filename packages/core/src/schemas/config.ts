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
  // experimental: z
  //   .object({
  //     joins: z.boolean().default(false).optional(),
  //   })
  //   .optional()
  //   .default({}),
  // rateLimit: z
  //   .object({
  //     enabled: z.boolean().default(false).optional(),
  //     storage: z.literal('database').optional(),
  //     modelName: z.string().optional().default('ratelimit'),
  //     fields: z
  //       .object({
  //         key: z.string().optional(),
  //         count: z.number().optional(),
  //         lastRequest: z.bigint().optional(),
  //       })
  //       .optional(),
  //   })
  //   .optional(),
  // secondaryStorage: z.unknown(), // Placeholder for redis,
  // advanced: z
  //   .object({
  //     database: z
  //       .object({
  //         useNumberId: z.boolean().default(false).optional(),
  //         generateId: z
  //           // .union([
  //           //   z.function({
  //           //     input: z.object({
  //           //       model: z.string(),
  //           //     }),
  //           //     output: z.unknown(),
  //           //   }),
  //           //   z.enum(['uuid', 'serial']),
  //           //   z.literal(false),
  //           // ])
  //           .any(), // We can refine this later to be more specific
  //         defaultFindManyLimit: z.number().min(1).optional().default(100),
  //       })
  //       .optional(),
  //   })
  //   .optional()
  //   .default({}),
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
