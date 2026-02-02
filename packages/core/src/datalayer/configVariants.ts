import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type {
  Config,
  ConfigVariant,
  Environment,
  EnvironmentSecret,
  ProviderConfig,
  TargetingRule,
  Variant,
  VariantVersion,
} from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createConfigVariant = z.object({
  configId: z.string().uuid(),
  variantId: z.string().uuid(),
});

const getConfigVariantById = z.object({
  id: z.string().uuid(),
});

const getConfigVariantsByConfigId = z.object({
  configId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const getConfigVariantsByVariantId = z.object({
  variantId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const deleteConfigVariant = z.object({
  id: z.string().uuid(),
});

const deleteConfigVariantByIds = z.object({
  configId: z.string().uuid(),
  variantId: z.string().uuid(),
});

const listConfigVariants = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const createVariantAndLinkToConfig = z.object({
  configId: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()).optional().default({}),
});

const getVariantJsonDataForConfig = z.object({
  configId: z.string(), // Can be UUID or slug
  envSecret: z.string().optional(),
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createConfigVariantDataLayer = (adapter: Adapter) => {
  return {
    createConfigVariant: async (
      params: z.infer<typeof createConfigVariant>
    ) => {
      const value = await createConfigVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, variantId } = value.data;

      return adapter.create<ConfigVariant>('config_variants', {
        id: randomUUID(),
        configId,
        variantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    getConfigVariantById: async (
      params: z.infer<typeof getConfigVariantById>
    ) => {
      const value = await getConfigVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.findOne<ConfigVariant>('config_variants', [
        { field: 'id', value: id },
      ]);
    },

    getConfigVariantsByConfigId: async (
      params: z.infer<typeof getConfigVariantsByConfigId>
    ) => {
      const value = await getConfigVariantsByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<ConfigVariant>('config_variants', {
        where: [{ field: 'configId', value: configId }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    getConfigVariantsByVariantId: async (
      params: z.infer<typeof getConfigVariantsByVariantId>
    ) => {
      const value = await getConfigVariantsByVariantId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<ConfigVariant>('config_variants', {
        where: [{ field: 'variantId', value: variantId }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    deleteConfigVariant: async (
      params: z.infer<typeof deleteConfigVariant>
    ) => {
      const value = await deleteConfigVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.delete<ConfigVariant>('config_variants', [
        { field: 'id', value: id },
      ]);
    },

    deleteConfigVariantByIds: async (
      params: z.infer<typeof deleteConfigVariantByIds>
    ) => {
      const value = await deleteConfigVariantByIds.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, variantId } = value.data;

      return adapter.findOne<ConfigVariant>('config_variants', [
        { field: 'configId', value: configId },
        { field: 'variantId', value: variantId },
      ]).then(async (cv) => {
        if (cv) {
          return adapter.delete<ConfigVariant>('config_variants', [
            { field: 'id', value: cv.id },
          ]);
        }
        return null;
      });
    },

    listConfigVariants: async (params?: z.infer<typeof listConfigVariants>) => {
      const value = await listConfigVariants.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<ConfigVariant>('config_variants', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    getConfigVariantWithDetails: async (
      params: z.infer<typeof getConfigVariantById>
    ) => {
      const value = await getConfigVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      const configVariant = await adapter.findOne<ConfigVariant>(
        'config_variants',
        [{ field: 'id', value: id }]
      );

      if (!configVariant) {
        return undefined;
      }

      // Get config and variant details
      const [config, variant] = await Promise.all([
        adapter.findOne<Config>('configs', [
          { field: 'id', value: configVariant.configId },
        ]),
        adapter.findOne<Variant>('variants', [
          { field: 'id', value: configVariant.variantId },
        ]),
      ]);

      // Get the latest version for this variant
      const versions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: configVariant.variantId }],
          orderBy: [{ field: 'version', direction: 'desc' }],
          limit: 1,
        }
      );

      return {
        ...configVariant,
        configName: config?.name ?? null,
        variantName: variant?.name ?? null,
        latestVersion: versions[0] ?? null,
      };
    },

    /**
     * Get config variants with details including latest version data
     */
    getConfigVariantsWithDetailsByConfigId: async (
      params: z.infer<typeof getConfigVariantsByConfigId>
    ) => {
      const value = await getConfigVariantsByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      const configVariants = await adapter.findMany<ConfigVariant>(
        'config_variants',
        {
          where: [{ field: 'configId', value: configId }],
          orderBy: [{ field: 'createdAt', direction: 'desc' }],
          limit,
          offset,
        }
      );

      if (configVariants.length === 0) {
        return [];
      }

      // Get variants and their latest versions
      const configVariantsWithVersions = await Promise.all(
        configVariants.map(async (cv) => {
          const [variant, versions] = await Promise.all([
            adapter.findOne<Variant>('variants', [
              { field: 'id', value: cv.variantId },
            ]),
            adapter.findMany<VariantVersion>('variant_versions', {
              where: [{ field: 'variantId', value: cv.variantId }],
              orderBy: [{ field: 'version', direction: 'desc' }],
              limit: 1,
            }),
          ]);

          const latestVersion = versions[0] ?? null;

          return {
            ...cv,
            name: variant?.name ?? null,
            provider: latestVersion?.provider ?? null,
            modelName: latestVersion?.modelName ?? null,
            jsonData: latestVersion?.jsonData ?? null,
            latestVersion,
          };
        })
      );

      return configVariantsWithVersions;
    },

    /**
     * Create a new variant with its first version and link to config
     */
    createVariantAndLinkToConfig: async (
      params: z.infer<typeof createVariantAndLinkToConfig>
    ) => {
      const value = await createVariantAndLinkToConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, name, provider, modelName, jsonData } = value.data;

      const variantId = randomUUID();
      const versionId = randomUUID();
      const now = new Date().toISOString();

      // Insert the variant (metadata only)
      const variant = await adapter.create<Variant>('variants', {
        id: variantId,
        name,
        createdAt: now,
        updatedAt: now,
      });

      if (!variant) {
        throw new LLMOpsError('Failed to create variant');
      }

      // Create the first version
      const version = await adapter.create<VariantVersion>('variant_versions', {
        id: versionId,
        variantId,
        version: 1,
        provider,
        modelName,
        jsonData: JSON.stringify(jsonData),
        createdAt: now,
        updatedAt: now,
      });

      if (!version) {
        throw new LLMOpsError('Failed to create variant version');
      }

      // Create the config-variant relation
      const configVariant = await adapter.create<ConfigVariant>(
        'config_variants',
        {
          id: randomUUID(),
          configId,
          variantId,
          createdAt: now,
          updatedAt: now,
        }
      );

      if (!configVariant) {
        throw new LLMOpsError('Failed to link variant to config');
      }

      return {
        variant,
        version,
        configVariant,
      };
    },

    /**
     * Get the variant version data for a config based on targeting rules.
     * If variantVersionId is specified in the targeting rule, use that specific version.
     * Otherwise, use the latest version.
     *
     * configId can be either a UUID or a short slug.
     */
    getVariantJsonDataForConfig: async (
      params: z.infer<typeof getVariantJsonDataForConfig>
    ) => {
      const value = await getVariantJsonDataForConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId: configIdOrSlug, envSecret } = value.data;

      // Resolve configId: check if it's a UUID or a slug
      let resolvedConfigId: string;

      if (UUID_REGEX.test(configIdOrSlug)) {
        resolvedConfigId = configIdOrSlug;
      } else {
        // Look up by slug
        const config = await adapter.findOne<Config>('configs', [
          { field: 'slug', value: configIdOrSlug },
        ]);

        if (!config) {
          throw new LLMOpsError(`Config not found: ${configIdOrSlug}`);
        }
        resolvedConfigId = config.id;
      }

      let environmentId: string;

      if (envSecret) {
        // Look up environment by secret keyValue
        const secret = await adapter.findOne<EnvironmentSecret>(
          'environment_secrets',
          [{ field: 'keyValue', value: envSecret }]
        );

        if (!secret) {
          throw new LLMOpsError('Invalid environment secret');
        }
        environmentId = secret.environmentId;
      } else {
        // No envSecret provided, get the production environment
        const prodEnv = await adapter.findOne<Environment>('environments', [
          { field: 'isProd', value: true },
        ]);

        if (!prodEnv) {
          throw new LLMOpsError('No production environment found');
        }
        environmentId = prodEnv.id;
      }

      // Get the targeting rule for this config + environment
      const targetingRules = await adapter.findMany<TargetingRule>(
        'targeting_rules',
        {
          where: [
            { field: 'configId', value: resolvedConfigId },
            { field: 'environmentId', value: environmentId },
            { field: 'enabled', value: true },
          ],
          orderBy: [
            { field: 'priority', direction: 'desc' },
            { field: 'weight', direction: 'desc' },
          ],
          limit: 1,
        }
      );

      const targetingRule = targetingRules[0];

      if (!targetingRule) {
        throw new LLMOpsError(
          `No targeting rule found for config ${resolvedConfigId} in environment ${environmentId}`
        );
      }

      // Get the config_variant to find the variantId
      const configVariant = await adapter.findOne<ConfigVariant>(
        'config_variants',
        [{ field: 'id', value: targetingRule.configVariantId }]
      );

      if (!configVariant) {
        throw new LLMOpsError(
          `No config variant found for ${targetingRule.configVariantId}`
        );
      }

      let versionData: VariantVersion | null = null;

      if (targetingRule.variantVersionId) {
        // Use the specific version pinned in the targeting rule
        versionData = await adapter.findOne<VariantVersion>('variant_versions', [
          { field: 'id', value: targetingRule.variantVersionId },
        ]);
      } else {
        // Use the latest version
        const versions = await adapter.findMany<VariantVersion>(
          'variant_versions',
          {
            where: [{ field: 'variantId', value: configVariant.variantId }],
            orderBy: [{ field: 'version', direction: 'desc' }],
            limit: 1,
          }
        );
        versionData = versions[0] ?? null;
      }

      if (!versionData) {
        throw new LLMOpsError(
          `No variant version found for variant ${configVariant.variantId}`
        );
      }

      // Backward compatibility: Resolve provider UUID to providerId string if necessary
      let finalProvider = versionData.provider;
      let providerConfigId: string | null = null;

      if (UUID_REGEX.test(versionData.provider)) {
        const providerConfig = await adapter.findOne<ProviderConfig>(
          'provider_configs',
          [{ field: 'id', value: versionData.provider }]
        );

        if (providerConfig) {
          finalProvider = providerConfig.providerId;
          providerConfigId = providerConfig.id;
        }
      }

      return {
        jsonData: versionData.jsonData,
        provider: finalProvider,
        modelName: versionData.modelName,
        version: versionData.version,
        providerConfigId, // Expose the specific config ID if used
        configId: resolvedConfigId,
        variantId: configVariant.variantId,
        environmentId,
      };
    },
  };
};
