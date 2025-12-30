import { SupportedProviders, type ProvidersConfig } from '@/providers';
import { z } from 'zod';

/**
 * Provider configuration schema
 *
 * This is a flexible schema that allows any provider configuration.
 * The actual provider validation happens at the gateway level.
 * Uses passthrough() to allow provider-specific options.
 */
const providerConfigSchema = z
  .object({
    apiKey: z.string().min(1, 'API key is required'),
    customHost: z.string().optional(),
    requestTimeout: z.number().optional(),
    forwardHeaders: z.array(z.string()).optional(),
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

/**
 * Auth configuration schema
 *
 * Uses a flexible schema with passthrough to allow different auth providers.
 * - Open source: basicAuth() from @llmops/sdk (type: 'basic')
 * - Enterprise: enterpriseAuth() from @llmops/enterprise (type: 'better-auth', etc.)
 *
 * The actual auth handling is done by the auth middleware based on the type.
 */
const authSchema = z
  .object({
    type: z.string().min(1, 'Auth type is required'),
  })
  .passthrough();

/**
 * Auto-migration configuration options:
 * - true: Always run migrations on startup
 * - false: Never run migrations on startup (default)
 * - 'development': Only run migrations when NODE_ENV is 'development'
 */
export type AutoMigrateConfig = boolean | 'development';

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
  autoMigrate: z
    .union([z.boolean(), z.literal('development')])
    .optional()
    .default(false),
  /**
   * Database schema name for PostgreSQL connections.
   * This sets the search_path on every connection.
   * Defaults to 'llmops'. Set to 'public' to use the default PostgreSQL schema.
   */
  schema: z.string().optional().default('llmops'),
});

/**
 * Base auth configuration interface
 * All auth providers must have at least a type field
 */
export interface AuthConfig {
  readonly type: string;
  [key: string]: unknown;
}

/**
 * Basic auth configuration (open source)
 */
export interface BasicAuthConfig extends AuthConfig {
  readonly type: 'basic';
  readonly defaultUser: string;
  readonly defaultPassword: string;
}

/**
 * Validated LLMOps configuration with typed providers
 * Uses ProvidersConfig for proper provider-specific typing
 *
 * Note: autoMigrate and schema are optional in input but always present after validation
 */
export type ValidatedLLMOpsConfig = Omit<
  z.infer<typeof llmopsConfigSchema>,
  'providers' | 'autoMigrate' | 'schema' | 'auth'
> & {
  providers: ProvidersConfig;
  autoMigrate?: AutoMigrateConfig;
  schema: string;
  auth: AuthConfig;
};

/**
 * Input type for LLMOps configuration (before validation)
 * Users can omit optional fields like autoMigrate and schema
 */
export type LLMOpsConfigInput = Omit<
  ValidatedLLMOpsConfig,
  'autoMigrate' | 'schema'
> & {
  autoMigrate?: AutoMigrateConfig;
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
