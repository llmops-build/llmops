import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
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

export const createConfigVariantDataLayer = (db: Kysely<Database>) => {
  return {
    createConfigVariant: async (
      params: z.infer<typeof createConfigVariant>
    ) => {
      const value = await createConfigVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, variantId } = value.data;

      return db
        .insertInto('config_variants')
        .values({
          id: randomUUID(),
          configId,
          variantId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    getConfigVariantById: async (
      params: z.infer<typeof getConfigVariantById>
    ) => {
      const value = await getConfigVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .selectFrom('config_variants')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    },
    getConfigVariantsByConfigId: async (
      params: z.infer<typeof getConfigVariantsByConfigId>
    ) => {
      const value = await getConfigVariantsByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('config_variants')
        .selectAll()
        .where('configId', '=', configId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    getConfigVariantsByVariantId: async (
      params: z.infer<typeof getConfigVariantsByVariantId>
    ) => {
      const value = await getConfigVariantsByVariantId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('config_variants')
        .selectAll()
        .where('variantId', '=', variantId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    deleteConfigVariant: async (
      params: z.infer<typeof deleteConfigVariant>
    ) => {
      const value = await deleteConfigVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .deleteFrom('config_variants')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },
    deleteConfigVariantByIds: async (
      params: z.infer<typeof deleteConfigVariantByIds>
    ) => {
      const value = await deleteConfigVariantByIds.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, variantId } = value.data;

      return db
        .deleteFrom('config_variants')
        .where('configId', '=', configId)
        .where('variantId', '=', variantId)
        .returningAll()
        .executeTakeFirst();
    },
    listConfigVariants: async (params?: z.infer<typeof listConfigVariants>) => {
      const value = await listConfigVariants.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('config_variants')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    getConfigVariantWithDetails: async (
      params: z.infer<typeof getConfigVariantById>
    ) => {
      const value = await getConfigVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      const configVariant = await db
        .selectFrom('config_variants')
        .leftJoin('configs', 'config_variants.configId', 'configs.id')
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'config_variants.id',
          'config_variants.configId',
          'config_variants.variantId',
          'config_variants.createdAt',
          'config_variants.updatedAt',
          'configs.name as configName',
          'variants.name as variantName',
        ])
        .where('config_variants.id', '=', id)
        .executeTakeFirst();

      if (!configVariant) {
        return undefined;
      }

      // Get the latest version for this variant
      const latestVersion = await db
        .selectFrom('variant_versions')
        .selectAll()
        .where('variantId', '=', configVariant.variantId)
        .orderBy('version', 'desc')
        .limit(1)
        .executeTakeFirst();

      return {
        ...configVariant,
        latestVersion: latestVersion ?? null,
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

      const configVariants = await db
        .selectFrom('config_variants')
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'config_variants.id',
          'config_variants.configId',
          'config_variants.variantId',
          'config_variants.createdAt',
          'config_variants.updatedAt',
          'variants.name',
        ])
        .where('config_variants.configId', '=', configId)
        .orderBy('config_variants.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      if (configVariants.length === 0) {
        return [];
      }

      // Get latest versions for each variant
      const configVariantsWithVersions = await Promise.all(
        configVariants.map(async (cv) => {
          const latestVersion = cv.variantId
            ? await db
                .selectFrom('variant_versions')
                .selectAll()
                .where('variantId', '=', cv.variantId)
                .orderBy('version', 'desc')
                .limit(1)
                .executeTakeFirst()
            : null;

          return {
            ...cv,
            provider: latestVersion?.provider ?? null,
            modelName: latestVersion?.modelName ?? null,
            jsonData: latestVersion?.jsonData ?? null,
            latestVersion: latestVersion ?? null,
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
      const variant = await db
        .insertInto('variants')
        .values({
          id: variantId,
          name,
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();

      if (!variant) {
        throw new LLMOpsError('Failed to create variant');
      }

      // Create the first version
      const version = await db
        .insertInto('variant_versions')
        .values({
          id: versionId,
          variantId,
          version: 1,
          provider,
          modelName,
          jsonData: JSON.stringify(jsonData),
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();

      if (!version) {
        throw new LLMOpsError('Failed to create variant version');
      }

      // Create the config-variant relation
      const configVariant = await db
        .insertInto('config_variants')
        .values({
          id: randomUUID(),
          configId,
          variantId,
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();

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
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let resolvedConfigId: string;

      if (UUID_REGEX.test(configIdOrSlug)) {
        resolvedConfigId = configIdOrSlug;
      } else {
        // Look up by slug
        const config = await db
          .selectFrom('configs')
          .select('id')
          .where('slug', '=', configIdOrSlug)
          .executeTakeFirst();

        if (!config) {
          throw new LLMOpsError(`Config not found: ${configIdOrSlug}`);
        }
        resolvedConfigId = config.id;
      }

      let environmentId: string;

      if (envSecret) {
        // Look up environment by secret keyValue
        const secret = await db
          .selectFrom('environment_secrets')
          .select('environmentId')
          .where('keyValue', '=', envSecret)
          .executeTakeFirst();

        if (!secret) {
          throw new LLMOpsError('Invalid environment secret');
        }
        environmentId = secret.environmentId;
      } else {
        // No envSecret provided, get the production environment
        const prodEnv = await db
          .selectFrom('environments')
          .select('id')
          .where('isProd', '=', true)
          .executeTakeFirst();

        if (!prodEnv) {
          throw new LLMOpsError('No production environment found');
        }
        environmentId = prodEnv.id;
      }

      // Get the targeting rule for this config + environment
      const targetingRule = await db
        .selectFrom('targeting_rules')
        .select(['configVariantId', 'variantVersionId'])
        .where('configId', '=', resolvedConfigId)
        .where('environmentId', '=', environmentId)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('weight', 'desc')
        .executeTakeFirst();

      if (!targetingRule) {
        throw new LLMOpsError(
          `No targeting rule found for config ${resolvedConfigId} in environment ${environmentId}`
        );
      }

      // Get the config_variant to find the variantId
      const configVariant = await db
        .selectFrom('config_variants')
        .select('variantId')
        .where('id', '=', targetingRule.configVariantId)
        .executeTakeFirst();

      if (!configVariant) {
        throw new LLMOpsError(
          `No config variant found for ${targetingRule.configVariantId}`
        );
      }

      let versionData;

      if (targetingRule.variantVersionId) {
        // Use the specific version pinned in the targeting rule
        versionData = await db
          .selectFrom('variant_versions')
          .select(['jsonData', 'provider', 'modelName', 'version'])
          .where('id', '=', targetingRule.variantVersionId)
          .executeTakeFirst();
      } else {
        // Use the latest version
        versionData = await db
          .selectFrom('variant_versions')
          .select(['jsonData', 'provider', 'modelName', 'version'])
          .where('variantId', '=', configVariant.variantId)
          .orderBy('version', 'desc')
          .limit(1)
          .executeTakeFirst();
      }

      if (!versionData) {
        throw new LLMOpsError(
          `No variant version found for variant ${configVariant.variantId}`
        );
      }

      return versionData;
    },
  };
};
