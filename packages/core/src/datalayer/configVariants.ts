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
  configId: z.string().uuid(),
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

      return db
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
          'variants.provider',
          'variants.modelName',
          'variants.jsonData',
        ])
        .where('config_variants.id', '=', id)
        .executeTakeFirst();
    },
    getConfigVariantsWithDetailsByConfigId: async (
      params: z.infer<typeof getConfigVariantsByConfigId>
    ) => {
      const value = await getConfigVariantsByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('config_variants')
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'config_variants.id',
          'variants.name',
          'config_variants.configId',
          'config_variants.variantId',
          'config_variants.createdAt',
          'config_variants.updatedAt',
          'variants.provider',
          'variants.modelName',
          'variants.jsonData',
        ])
        .where('config_variants.configId', '=', configId)
        .orderBy('config_variants.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    createVariantAndLinkToConfig: async (
      params: z.infer<typeof createVariantAndLinkToConfig>
    ) => {
      const value = await createVariantAndLinkToConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, name, provider, modelName, jsonData } = value.data;

      const variantId = randomUUID();
      const now = new Date().toISOString();

      // Insert the variant
      const variant = await db
        .insertInto('variants')
        .values({
          id: variantId,
          name,
          provider,
          modelName,
          jsonData: JSON.stringify(jsonData),
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();

      if (!variant) {
        throw new LLMOpsError('Failed to create variant');
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
        configVariant,
      };
    },

    /**
     * Get the variant jsonData for a config.
     * If envSecret is provided, look up the environment by the secret's keyValue.
     * If envSecret is not provided, use the production environment (isProd = true).
     */
    getVariantJsonDataForConfig: async (
      params: z.infer<typeof getVariantJsonDataForConfig>
    ) => {
      const value = await getVariantJsonDataForConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, envSecret } = value.data;

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
        .select('configVariantId')
        .where('configId', '=', configId)
        .where('environmentId', '=', environmentId)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('weight', 'desc')
        .executeTakeFirst();

      if (!targetingRule) {
        throw new LLMOpsError(
          `No targeting rule found for config ${configId} in environment ${environmentId}`
        );
      }

      // Get the variant jsonData through the config_variant
      const result = await db
        .selectFrom('config_variants')
        .innerJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'variants.jsonData',
          'variants.provider',
          'variants.modelName',
        ])
        .where('config_variants.id', '=', targetingRule.configVariantId)
        .executeTakeFirst();

      if (!result) {
        throw new LLMOpsError(
          `No variant found for config variant ${targetingRule.configVariantId}`
        );
      }

      return result;
    },
  };
};
