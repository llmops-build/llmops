import { z } from 'zod';

/**
 * Convex configuration schema
 */
export const convexConfigSchema = z.object({
  /** The Convex deployment URL (e.g., https://your-deployment.convex.cloud) */
  url: z.string().url(),
});

export const llmopsConfigSchema = z.object({
  /**
   * Kysely database connection.
   * Required when using SQL databases (PostgreSQL, MySQL, SQLite).
   * Mutually exclusive with `convex`.
   */
  database: z.any().optional(),
  /**
   * Convex configuration for using Convex as the database backend.
   * Mutually exclusive with `database`.
   *
   * Note: When using Convex, you'll need to:
   * 1. Deploy the Convex schema and functions from @llmops/core/convex to your Convex project
   * 2. Create the Convex adapter manually with createConvexAdapter()
   *
   * @example
   * ```ts
   * import { ConvexHttpClient } from 'convex/browser';
   * import { createConvexAdapter, createDataLayer } from '@llmops/core';
   * import { api } from '../convex/_generated/api';
   *
   * const client = new ConvexHttpClient(process.env.CONVEX_URL!);
   * const adapter = createConvexAdapter(client, api);
   * const dataLayer = createDataLayer(adapter);
   * ```
   */
  convex: convexConfigSchema.optional(),
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
   * Only applicable when using `database` (not Convex).
   */
  schema: z.string().optional().default('llmops'),
}).refine(
  (config) => config.database || config.convex,
  'Either database or convex must be provided'
).refine(
  (config) => !(config.database && config.convex),
  'Cannot specify both database and convex - choose one'
);

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
