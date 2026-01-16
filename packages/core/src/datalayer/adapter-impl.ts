/**
 * Adapter-Based Datalayer Implementation
 *
 * This module provides a datalayer implementation that works with any DatabaseAdapter.
 * It provides the same interface as the Kysely-based datalayer but uses the adapter
 * abstraction for database operations.
 *
 * For databases that don't support certain features (e.g., joins, aggregations),
 * operations are performed client-side using the client-aggregation helpers.
 *
 * Note: For full SQL databases, the regular Kysely-based datalayer is recommended
 * as it provides better performance for complex queries.
 */

import { LLMOpsError } from '@/error';
import { randomBytes } from 'node:crypto';
import z from 'zod';
import type {
  DatabaseAdapter,
  Where,
  BaseEntity,
} from '../adapter/types';
import { where } from '../adapter/types';
import { clientAggregate } from '../adapter/client-aggregations';
import type {
  Config,
  Variant,
  VariantVersion,
  Environment,
  EnvironmentSecret,
  ConfigVariant,
  TargetingRule,
  WorkspaceSettings,
  ProviderConfig,
  LLMRequest,
} from '../db/schema';

// ============================================================================
// Zod Schemas (reused from existing datalayer)
// ============================================================================

const createNewConfigSchema = z.object({
  name: z.string(),
});

const updateConfigNameSchema = z.object({
  configId: z.string().uuid(),
  newName: z.string(),
});

const idSchema = z.object({
  configId: z.string().uuid(),
});

const variantIdSchema = z.object({
  variantId: z.string().uuid(),
});

const environmentIdSchema = z.object({
  environmentId: z.string().uuid(),
});

const listSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const createEnvironmentSchema = z.object({
  name: z.string(),
  slug: z.string(),
  isProd: z.boolean().optional(),
});

const createVariantSchema = z.object({
  name: z.string(),
});

const createVariantVersionSchema = z.object({
  variantId: z.string().uuid(),
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()),
});

const createConfigVariantSchema = z.object({
  configId: z.string().uuid(),
  variantId: z.string().uuid(),
});

const createTargetingRuleSchema = z.object({
  environmentId: z.string().uuid(),
  configId: z.string().uuid(),
  configVariantId: z.string().uuid(),
  variantVersionId: z.string().uuid().nullable().optional(),
  weight: z.number().int().min(0).max(10000).optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
});

const updateTargetingRuleSchema = z.object({
  ruleId: z.string().uuid(),
  variantVersionId: z.string().uuid().nullable().optional(),
  weight: z.number().int().min(0).max(10000).optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
});

const createEnvironmentSecretSchema = z.object({
  environmentId: z.string().uuid(),
  keyName: z.string(),
  keyValue: z.string(),
});

const upsertProviderConfigSchema = z.object({
  providerId: z.string(),
  name: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional(),
});

const insertLLMRequestSchema = z.object({
  requestId: z.string().uuid(),
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0),
  cost: z.number().int().default(0),
  inputCost: z.number().int().default(0),
  outputCost: z.number().int().default(0),
  endpoint: z.string(),
  statusCode: z.number().int(),
  latencyMs: z.number().int().default(0),
  isStreaming: z.boolean().default(false),
  userId: z.string().nullable().optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

export type LLMRequestInsert = z.infer<typeof insertLLMRequestSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a short unique ID for configs (8 characters, URL-safe)
 */
function generateShortId(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Validate params with Zod schema
 */
async function validate<T extends z.ZodType>(
  schema: T,
  params: unknown
): Promise<z.infer<T>> {
  const result = await schema.safeParseAsync(params);
  if (!result.success) {
    throw new LLMOpsError(`Invalid parameters: ${result.error.message}`);
  }
  return result.data;
}

// ============================================================================
// Adapter-Based Datalayer Factory
// ============================================================================

/**
 * Create a datalayer instance from a DatabaseAdapter
 *
 * This provides the same interface as the Kysely-based datalayer but uses
 * the adapter abstraction for database operations.
 */
export const createAdapterDataLayer = (adapter: DatabaseAdapter) => {
  return {
    // ========================================================================
    // Configs
    // ========================================================================

    createNewConfig: async (
      params: z.infer<typeof createNewConfigSchema>
    ): Promise<Config | undefined> => {
      const { name } = await validate(createNewConfigSchema, params);
      const result = await adapter.create<Config & BaseEntity>('configs', {
        slug: generateShortId(),
        name,
      } as any);
      return result as Config;
    },

    updateConfigName: async (
      params: z.infer<typeof updateConfigNameSchema>
    ): Promise<Config | null> => {
      const { configId, newName } = await validate(
        updateConfigNameSchema,
        params
      );
      const result = await adapter.update<Config & BaseEntity>(
        'configs',
        [where.eq('id', configId)],
        { name: newName } as any
      );
      return result as Config | null;
    },

    getConfigById: async (
      params: z.infer<typeof idSchema>
    ): Promise<Config | null> => {
      const { configId } = await validate(idSchema, params);
      const result = await adapter.findOne<Config & BaseEntity>('configs', {
        where: [where.eq('id', configId)],
      });
      return result as Config | null;
    },

    deleteConfig: async (
      params: z.infer<typeof idSchema>
    ): Promise<Config | null> => {
      const { configId } = await validate(idSchema, params);
      const existing = await adapter.findOne<Config & BaseEntity>('configs', {
        where: [where.eq('id', configId)],
      });
      if (existing) {
        await adapter.delete('configs', [where.eq('id', configId)]);
      }
      return existing as Config | null;
    },

    listConfigs: async (
      params?: z.infer<typeof listSchema>
    ): Promise<Config[]> => {
      const { limit = 100, offset = 0 } = await validate(
        listSchema,
        params || {}
      );
      const results = await adapter.findMany<Config & BaseEntity>('configs', {
        limit,
        offset,
        orderBy: { field: 'createdAt', direction: 'desc' },
      });
      return results as Config[];
    },

    /**
     * Get config with its variants and their latest versions
     * Note: This performs client-side joins for databases without JOIN support
     */
    getConfigWithVariants: async (params: z.infer<typeof idSchema>) => {
      const { configId } = await validate(idSchema, params);

      // Get the config
      const config = await adapter.findOne<Config & BaseEntity>('configs', {
        where: [where.eq('id', configId)],
      });

      if (!config) {
        return [];
      }

      // Get config variants
      const configVariants = await adapter.findMany<
        ConfigVariant & BaseEntity
      >('config_variants', {
        where: [where.eq('configId', configId)],
      });

      if (configVariants.length === 0) {
        return [
          {
            ...config,
            variantId: null,
            variantName: null,
            provider: null,
            modelName: null,
            jsonData: null,
          },
        ];
      }

      // Get variants
      const variantIds = configVariants.map((cv) => cv.variantId);
      const variants = await adapter.findMany<Variant & BaseEntity>('variants', {
        where: [where.in('id', variantIds)],
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // Get latest versions for each variant (client-side)
      const results = await Promise.all(
        configVariants.map(async (cv) => {
          const variant = variantMap.get(cv.variantId);
          const versions = await adapter.findMany<VariantVersion & BaseEntity>(
            'variant_versions',
            {
              where: [where.eq('variantId', cv.variantId)],
              orderBy: { field: 'version', direction: 'desc' },
              limit: 1,
            }
          );
          const latestVersion = versions[0];

          return {
            id: config.id,
            slug: (config as any).slug,
            name: config.name,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            variantId: cv.variantId,
            variantName: variant?.name ?? null,
            provider: latestVersion?.provider ?? null,
            modelName: latestVersion?.modelName ?? null,
            jsonData: latestVersion?.jsonData ?? null,
          };
        })
      );

      return results;
    },

    // ========================================================================
    // Variants
    // ========================================================================

    createVariant: async (
      params: z.infer<typeof createVariantSchema>
    ): Promise<Variant | undefined> => {
      const { name } = await validate(createVariantSchema, params);
      const result = await adapter.create<Variant & BaseEntity>('variants', {
        name,
      } as any);
      return result as Variant;
    },

    getVariantById: async (
      params: z.infer<typeof variantIdSchema>
    ): Promise<Variant | null> => {
      const { variantId } = await validate(variantIdSchema, params);
      const result = await adapter.findOne<Variant & BaseEntity>('variants', {
        where: [where.eq('id', variantId)],
      });
      return result as Variant | null;
    },

    listVariants: async (
      params?: z.infer<typeof listSchema>
    ): Promise<Variant[]> => {
      const { limit = 100, offset = 0 } = await validate(
        listSchema,
        params || {}
      );
      const results = await adapter.findMany<Variant & BaseEntity>('variants', {
        limit,
        offset,
        orderBy: { field: 'createdAt', direction: 'desc' },
      });
      return results as Variant[];
    },

    deleteVariant: async (
      params: z.infer<typeof variantIdSchema>
    ): Promise<Variant | null> => {
      const { variantId } = await validate(variantIdSchema, params);
      const existing = await adapter.findOne<Variant & BaseEntity>('variants', {
        where: [where.eq('id', variantId)],
      });
      if (existing) {
        await adapter.delete('variants', [where.eq('id', variantId)]);
      }
      return existing as Variant | null;
    },

    // ========================================================================
    // Variant Versions
    // ========================================================================

    createVariantVersion: async (
      params: z.infer<typeof createVariantVersionSchema>
    ): Promise<VariantVersion | undefined> => {
      const data = await validate(createVariantVersionSchema, params);

      // Get max version for this variant (client-side for NoSQL)
      const existingVersions = await adapter.findMany<
        VariantVersion & BaseEntity
      >('variant_versions', {
        where: [where.eq('variantId', data.variantId)],
        orderBy: { field: 'version', direction: 'desc' },
        limit: 1,
      });

      const maxVersion = existingVersions[0]?.version ?? 0;
      const newVersion = maxVersion + 1;

      const result = await adapter.create<VariantVersion & BaseEntity>(
        'variant_versions',
        {
          variantId: data.variantId,
          version: newVersion,
          provider: data.provider,
          modelName: data.modelName,
          jsonData: data.jsonData,
        } as any
      );

      return result as VariantVersion;
    },

    getLatestVariantVersion: async (
      params: z.infer<typeof variantIdSchema>
    ): Promise<VariantVersion | null> => {
      const { variantId } = await validate(variantIdSchema, params);
      const results = await adapter.findMany<VariantVersion & BaseEntity>(
        'variant_versions',
        {
          where: [where.eq('variantId', variantId)],
          orderBy: { field: 'version', direction: 'desc' },
          limit: 1,
        }
      );
      return (results[0] as VariantVersion) ?? null;
    },

    listVariantVersions: async (
      params: z.infer<typeof variantIdSchema> & z.infer<typeof listSchema>
    ): Promise<VariantVersion[]> => {
      const { variantId } = await validate(variantIdSchema, params);
      const { limit = 100, offset = 0 } = await validate(
        listSchema,
        params || {}
      );
      const results = await adapter.findMany<VariantVersion & BaseEntity>(
        'variant_versions',
        {
          where: [where.eq('variantId', variantId)],
          limit,
          offset,
          orderBy: { field: 'version', direction: 'desc' },
        }
      );
      return results as VariantVersion[];
    },

    // ========================================================================
    // Environments
    // ========================================================================

    createEnvironment: async (
      params: z.infer<typeof createEnvironmentSchema>
    ): Promise<Environment | undefined> => {
      const data = await validate(createEnvironmentSchema, params);
      const result = await adapter.create<Environment & BaseEntity>(
        'environments',
        {
          name: data.name,
          slug: data.slug,
          isProd: data.isProd ?? false,
        } as any
      );
      return result as Environment;
    },

    getEnvironmentById: async (
      params: z.infer<typeof environmentIdSchema>
    ): Promise<Environment | null> => {
      const { environmentId } = await validate(environmentIdSchema, params);
      const result = await adapter.findOne<Environment & BaseEntity>(
        'environments',
        {
          where: [where.eq('id', environmentId)],
        }
      );
      return result as Environment | null;
    },

    getEnvironmentBySlug: async (slug: string): Promise<Environment | null> => {
      const result = await adapter.findOne<Environment & BaseEntity>(
        'environments',
        {
          where: [where.eq('slug', slug)],
        }
      );
      return result as Environment | null;
    },

    listEnvironments: async (
      params?: z.infer<typeof listSchema>
    ): Promise<Environment[]> => {
      const { limit = 100, offset = 0 } = await validate(
        listSchema,
        params || {}
      );
      const results = await adapter.findMany<Environment & BaseEntity>(
        'environments',
        {
          limit,
          offset,
          orderBy: { field: 'createdAt', direction: 'desc' },
        }
      );
      return results as Environment[];
    },

    deleteEnvironment: async (
      params: z.infer<typeof environmentIdSchema>
    ): Promise<Environment | null> => {
      const { environmentId } = await validate(environmentIdSchema, params);
      const existing = await adapter.findOne<Environment & BaseEntity>(
        'environments',
        {
          where: [where.eq('id', environmentId)],
        }
      );
      if (existing && !(existing as any).isProd) {
        await adapter.delete('environments', [where.eq('id', environmentId)]);
        return existing as Environment;
      }
      return null;
    },

    // ========================================================================
    // Environment Secrets
    // ========================================================================

    createEnvironmentSecret: async (
      params: z.infer<typeof createEnvironmentSecretSchema>
    ): Promise<EnvironmentSecret | undefined> => {
      const data = await validate(createEnvironmentSecretSchema, params);
      const result = await adapter.create<EnvironmentSecret & BaseEntity>(
        'environment_secrets',
        {
          environmentId: data.environmentId,
          keyName: data.keyName,
          keyValue: data.keyValue,
        } as any
      );
      return result as EnvironmentSecret;
    },

    listEnvironmentSecrets: async (
      params: z.infer<typeof environmentIdSchema>
    ): Promise<EnvironmentSecret[]> => {
      const { environmentId } = await validate(environmentIdSchema, params);
      const results = await adapter.findMany<EnvironmentSecret & BaseEntity>(
        'environment_secrets',
        {
          where: [where.eq('environmentId', environmentId)],
          orderBy: { field: 'keyName', direction: 'asc' },
        }
      );
      return results as EnvironmentSecret[];
    },

    deleteEnvironmentSecret: async (secretId: string): Promise<void> => {
      await adapter.delete('environment_secrets', [where.eq('id', secretId)]);
    },

    // ========================================================================
    // Config Variants
    // ========================================================================

    createConfigVariant: async (
      params: z.infer<typeof createConfigVariantSchema>
    ): Promise<ConfigVariant | undefined> => {
      const data = await validate(createConfigVariantSchema, params);
      const result = await adapter.create<ConfigVariant & BaseEntity>(
        'config_variants',
        {
          configId: data.configId,
          variantId: data.variantId,
        } as any
      );
      return result as ConfigVariant;
    },

    listConfigVariants: async (
      params: z.infer<typeof idSchema>
    ): Promise<ConfigVariant[]> => {
      const { configId } = await validate(idSchema, params);
      const results = await adapter.findMany<ConfigVariant & BaseEntity>(
        'config_variants',
        {
          where: [where.eq('configId', configId)],
        }
      );
      return results as ConfigVariant[];
    },

    deleteConfigVariant: async (configVariantId: string): Promise<void> => {
      await adapter.delete('config_variants', [
        where.eq('id', configVariantId),
      ]);
    },

    // ========================================================================
    // Targeting Rules
    // ========================================================================

    createTargetingRule: async (
      params: z.infer<typeof createTargetingRuleSchema>
    ): Promise<TargetingRule | undefined> => {
      const data = await validate(createTargetingRuleSchema, params);
      const result = await adapter.create<TargetingRule & BaseEntity>(
        'targeting_rules',
        {
          environmentId: data.environmentId,
          configId: data.configId,
          configVariantId: data.configVariantId,
          variantVersionId: data.variantVersionId ?? null,
          weight: data.weight ?? 10000,
          priority: data.priority ?? 0,
          enabled: data.enabled ?? true,
          conditions: data.conditions ?? {},
        } as any
      );
      return result as TargetingRule;
    },

    updateTargetingRule: async (
      params: z.infer<typeof updateTargetingRuleSchema>
    ): Promise<TargetingRule | null> => {
      const { ruleId, ...updateData } = await validate(
        updateTargetingRuleSchema,
        params
      );
      const result = await adapter.update<TargetingRule & BaseEntity>(
        'targeting_rules',
        [where.eq('id', ruleId)],
        updateData as any
      );
      return result as TargetingRule | null;
    },

    listTargetingRules: async (params: {
      configId?: string;
      environmentId?: string;
    }): Promise<TargetingRule[]> => {
      const whereConditions: Where = [];
      if (params.configId) {
        whereConditions.push(where.eq('configId', params.configId));
      }
      if (params.environmentId) {
        whereConditions.push(where.eq('environmentId', params.environmentId));
      }
      const results = await adapter.findMany<TargetingRule & BaseEntity>(
        'targeting_rules',
        {
          where: whereConditions.length > 0 ? whereConditions : undefined,
          orderBy: [
            { field: 'priority', direction: 'desc' },
            { field: 'createdAt', direction: 'desc' },
          ],
        }
      );
      return results as TargetingRule[];
    },

    deleteTargetingRule: async (ruleId: string): Promise<void> => {
      await adapter.delete('targeting_rules', [where.eq('id', ruleId)]);
    },

    // ========================================================================
    // Workspace Settings
    // ========================================================================

    getWorkspaceSettings: async (): Promise<WorkspaceSettings | undefined> => {
      let settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );

      if (!settings) {
        settings = await adapter.create<WorkspaceSettings & BaseEntity>(
          'workspace_settings',
          {
            name: null,
            setupComplete: false,
            superAdminId: null,
          } as any
        );
      }

      return settings as WorkspaceSettings;
    },

    updateWorkspaceSettings: async (params: {
      name?: string | null;
      setupComplete?: boolean;
      superAdminId?: string | null;
    }): Promise<WorkspaceSettings | null> => {
      let settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );

      if (!settings) {
        settings = await adapter.create<WorkspaceSettings & BaseEntity>(
          'workspace_settings',
          {
            name: params.name ?? null,
            setupComplete: params.setupComplete ?? false,
            superAdminId: params.superAdminId ?? null,
          } as any
        );
        return settings as WorkspaceSettings;
      }

      const result = await adapter.update<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        [where.eq('id', settings.id)],
        params as any
      );
      return result as WorkspaceSettings | null;
    },

    getSuperAdminId: async (): Promise<string | null> => {
      const settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );
      return (settings as any)?.superAdminId ?? null;
    },

    setSuperAdminId: async (userId: string): Promise<boolean> => {
      let settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );

      if ((settings as any)?.superAdminId) {
        return false;
      }

      if (!settings) {
        await adapter.create<WorkspaceSettings & BaseEntity>(
          'workspace_settings',
          {
            name: null,
            setupComplete: false,
            superAdminId: userId,
          } as any
        );
        return true;
      }

      await adapter.update<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        [where.eq('id', settings.id)],
        { superAdminId: userId } as any
      );
      return true;
    },

    isSetupComplete: async (): Promise<boolean> => {
      const settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );
      return (settings as any)?.setupComplete ?? false;
    },

    markSetupComplete: async (): Promise<WorkspaceSettings | undefined> => {
      let settings = await adapter.findOne<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        {}
      );

      if (!settings) {
        settings = await adapter.create<WorkspaceSettings & BaseEntity>(
          'workspace_settings',
          {
            name: null,
            setupComplete: true,
            superAdminId: null,
          } as any
        );
        return settings as WorkspaceSettings;
      }

      const result = await adapter.update<WorkspaceSettings & BaseEntity>(
        'workspace_settings',
        [where.eq('id', settings.id)],
        { setupComplete: true } as any
      );
      return result as WorkspaceSettings | undefined;
    },

    // ========================================================================
    // Provider Configs
    // ========================================================================

    upsertProviderConfig: async (
      params: z.infer<typeof upsertProviderConfigSchema>
    ): Promise<ProviderConfig | undefined> => {
      const data = await validate(upsertProviderConfigSchema, params);

      // Check if provider config exists
      const existing = await adapter.findOne<ProviderConfig & BaseEntity>(
        'provider_configs',
        {
          where: [where.eq('providerId', data.providerId)],
        }
      );

      if (existing) {
        const result = await adapter.update<ProviderConfig & BaseEntity>(
          'provider_configs',
          [where.eq('id', existing.id)],
          {
            name: data.name ?? null,
            config: data.config,
            enabled: data.enabled ?? true,
          } as any
        );
        return result as ProviderConfig | undefined;
      }

      const result = await adapter.create<ProviderConfig & BaseEntity>(
        'provider_configs',
        {
          providerId: data.providerId,
          name: data.name ?? null,
          config: data.config,
          enabled: data.enabled ?? true,
        } as any
      );
      return result as ProviderConfig;
    },

    getProviderConfig: async (
      providerId: string
    ): Promise<ProviderConfig | null> => {
      const result = await adapter.findOne<ProviderConfig & BaseEntity>(
        'provider_configs',
        {
          where: [where.eq('providerId', providerId)],
        }
      );
      return result as ProviderConfig | null;
    },

    listProviderConfigs: async (): Promise<ProviderConfig[]> => {
      const results = await adapter.findMany<ProviderConfig & BaseEntity>(
        'provider_configs',
        {
          orderBy: { field: 'providerId', direction: 'asc' },
        }
      );
      return results as ProviderConfig[];
    },

    deleteProviderConfig: async (providerId: string): Promise<void> => {
      await adapter.delete('provider_configs', [
        where.eq('providerId', providerId),
      ]);
    },

    // ========================================================================
    // LLM Requests
    // ========================================================================

    insertRequest: async (
      request: LLMRequestInsert
    ): Promise<LLMRequest | undefined> => {
      const data = await validate(insertLLMRequestSchema, request);
      const result = await adapter.create<LLMRequest & BaseEntity>(
        'llm_requests',
        {
          requestId: data.requestId,
          configId: data.configId ?? null,
          variantId: data.variantId ?? null,
          environmentId: data.environmentId ?? null,
          providerConfigId: data.providerConfigId ?? null,
          provider: data.provider,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          cachedTokens: data.cachedTokens,
          cost: data.cost,
          inputCost: data.inputCost,
          outputCost: data.outputCost,
          endpoint: data.endpoint,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          isStreaming: data.isStreaming,
          userId: data.userId ?? null,
          tags: data.tags,
        } as any
      );
      return result as LLMRequest;
    },

    batchInsertRequests: async (
      requests: LLMRequestInsert[]
    ): Promise<{ count: number }> => {
      if (requests.length === 0) return { count: 0 };

      const validatedRequests = await Promise.all(
        requests.map((req) => validate(insertLLMRequestSchema, req))
      );

      const result = await adapter.createMany<LLMRequest & BaseEntity>(
        'llm_requests',
        validatedRequests.map((data) => ({
          requestId: data.requestId,
          configId: data.configId ?? null,
          variantId: data.variantId ?? null,
          environmentId: data.environmentId ?? null,
          providerConfigId: data.providerConfigId ?? null,
          provider: data.provider,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          cachedTokens: data.cachedTokens,
          cost: data.cost,
          inputCost: data.inputCost,
          outputCost: data.outputCost,
          endpoint: data.endpoint,
          statusCode: data.statusCode,
          latencyMs: data.latencyMs,
          isStreaming: data.isStreaming,
          userId: data.userId ?? null,
          tags: data.tags,
        })) as any[]
      );

      return result;
    },

    getRequestByRequestId: async (
      requestId: string
    ): Promise<LLMRequest | null> => {
      const result = await adapter.findOne<LLMRequest & BaseEntity>(
        'llm_requests',
        {
          where: [where.eq('requestId', requestId)],
        }
      );
      return result as LLMRequest | null;
    },

    listRequests: async (params?: {
      limit?: number;
      offset?: number;
      configId?: string;
      variantId?: string;
      environmentId?: string;
      provider?: string;
      model?: string;
      startDate?: Date;
      endDate?: Date;
    }) => {
      const whereConditions: Where = [];

      if (params?.configId) {
        whereConditions.push(where.eq('configId', params.configId));
      }
      if (params?.variantId) {
        whereConditions.push(where.eq('variantId', params.variantId));
      }
      if (params?.environmentId) {
        whereConditions.push(where.eq('environmentId', params.environmentId));
      }
      if (params?.provider) {
        whereConditions.push(where.eq('provider', params.provider));
      }
      if (params?.model) {
        whereConditions.push(where.eq('model', params.model));
      }
      if (params?.startDate) {
        whereConditions.push(
          where.gte('createdAt', params.startDate.toISOString())
        );
      }
      if (params?.endDate) {
        whereConditions.push(
          where.lte('createdAt', params.endDate.toISOString())
        );
      }

      const limit = params?.limit ?? 100;
      const offset = params?.offset ?? 0;

      const data = await adapter.findMany<LLMRequest & BaseEntity>(
        'llm_requests',
        {
          where: whereConditions.length > 0 ? whereConditions : undefined,
          limit,
          offset,
          orderBy: { field: 'createdAt', direction: 'desc' },
        }
      );

      // Client-side count for total
      const total = await adapter.count(
        'llm_requests',
        whereConditions.length > 0 ? whereConditions : undefined
      );

      return {
        data: data as LLMRequest[],
        total,
        limit,
        offset,
      };
    },

    /**
     * Get total cost for a date range
     * Uses client-side aggregation for databases without native support
     */
    getTotalCost: async (params: {
      startDate: Date;
      endDate: Date;
      configId?: string;
      variantId?: string;
      environmentId?: string;
    }) => {
      const whereConditions: Where = [
        where.gte('createdAt', params.startDate.toISOString()),
        where.lte('createdAt', params.endDate.toISOString()),
      ];

      if (params.configId) {
        whereConditions.push(where.eq('configId', params.configId));
      }
      if (params.variantId) {
        whereConditions.push(where.eq('variantId', params.variantId));
      }
      if (params.environmentId) {
        whereConditions.push(where.eq('environmentId', params.environmentId));
      }

      // Use client-side aggregation
      const results = await clientAggregate<LLMRequest & BaseEntity>(
        adapter,
        'llm_requests',
        {
          aggregates: [
            { field: 'cost', function: 'sum', alias: 'totalCost' },
            { field: 'inputCost', function: 'sum', alias: 'totalInputCost' },
            { field: 'outputCost', function: 'sum', alias: 'totalOutputCost' },
            { field: 'promptTokens', function: 'sum', alias: 'totalPromptTokens' },
            {
              field: 'completionTokens',
              function: 'sum',
              alias: 'totalCompletionTokens',
            },
            { field: 'totalTokens', function: 'sum', alias: 'totalTokens' },
            { field: 'id', function: 'count', alias: 'requestCount' },
          ],
          where: whereConditions,
        }
      );

      return results[0] ?? {
        totalCost: 0,
        totalInputCost: 0,
        totalOutputCost: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        requestCount: 0,
      };
    },

    /**
     * Get cost breakdown by model
     */
    getCostByModel: async (params: { startDate: Date; endDate: Date }) => {
      const whereConditions: Where = [
        where.gte('createdAt', params.startDate.toISOString()),
        where.lte('createdAt', params.endDate.toISOString()),
      ];

      const results = await clientAggregate<LLMRequest & BaseEntity>(
        adapter,
        'llm_requests',
        {
          aggregates: [
            { field: 'cost', function: 'sum', alias: 'totalCost' },
            { field: 'inputCost', function: 'sum', alias: 'totalInputCost' },
            { field: 'outputCost', function: 'sum', alias: 'totalOutputCost' },
            { field: 'totalTokens', function: 'sum', alias: 'totalTokens' },
            { field: 'id', function: 'count', alias: 'requestCount' },
            { field: 'latencyMs', function: 'avg', alias: 'avgLatencyMs' },
          ],
          where: whereConditions,
          groupBy: ['provider', 'model'],
          orderBy: { field: 'totalCost', direction: 'desc' },
        }
      );

      return results;
    },

    /**
     * Get cost breakdown by provider
     */
    getCostByProvider: async (params: { startDate: Date; endDate: Date }) => {
      const whereConditions: Where = [
        where.gte('createdAt', params.startDate.toISOString()),
        where.lte('createdAt', params.endDate.toISOString()),
      ];

      const results = await clientAggregate<LLMRequest & BaseEntity>(
        adapter,
        'llm_requests',
        {
          aggregates: [
            { field: 'cost', function: 'sum', alias: 'totalCost' },
            { field: 'inputCost', function: 'sum', alias: 'totalInputCost' },
            { field: 'outputCost', function: 'sum', alias: 'totalOutputCost' },
            { field: 'totalTokens', function: 'sum', alias: 'totalTokens' },
            { field: 'id', function: 'count', alias: 'requestCount' },
            { field: 'latencyMs', function: 'avg', alias: 'avgLatencyMs' },
          ],
          where: whereConditions,
          groupBy: ['provider'],
          orderBy: { field: 'totalCost', direction: 'desc' },
        }
      );

      return results;
    },
  };
};

/**
 * Type for the adapter-based datalayer
 */
export type AdapterDataLayer = ReturnType<typeof createAdapterDataLayer>;
