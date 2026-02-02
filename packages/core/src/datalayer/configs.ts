import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { Config, ConfigVariant, Variant, VariantVersion } from '@/schemas';
import { randomUUID, randomBytes } from 'node:crypto';
import z from 'zod';

/**
 * Generate a short unique ID for configs (8 characters, URL-safe)
 * Uses base62 encoding (a-z, A-Z, 0-9) for shorter, readable IDs
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

const createNewConfig = z.object({
  name: z.string(),
});

const updateConfigName = z.object({
  configId: z.uuidv4(),
  newName: z.string(),
});

const getConfigById = z.object({
  configId: z.uuidv4(),
});

const deleteConfig = z.object({
  configId: z.uuidv4(),
});

const listConfigs = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createConfigDataLayer = (adapter: Adapter) => {
  return {
    createNewConfig: async (params: z.infer<typeof createNewConfig>) => {
      const value = await createNewConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name } = value.data;

      return adapter.create<Config>('configs', {
        id: randomUUID(),
        slug: generateShortId(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    updateConfigName: async (params: z.infer<typeof updateConfigName>) => {
      const value = await updateConfigName.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { newName, configId } = value.data;

      return adapter.update<Config>(
        'configs',
        [{ field: 'id', value: configId }],
        {
          name: newName,
          updatedAt: new Date().toISOString(),
        }
      );
    },

    getConfigById: async (params: z.infer<typeof getConfigById>) => {
      const value = await getConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return adapter.findOne<Config>('configs', [
        { field: 'id', value: configId },
      ]);
    },

    deleteConfig: async (params: z.infer<typeof deleteConfig>) => {
      const value = await deleteConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return adapter.delete<Config>('configs', [
        { field: 'id', value: configId },
      ]);
    },

    listConfigs: async (params?: z.infer<typeof listConfigs>) => {
      const value = await listConfigs.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<Config>('configs', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    /**
     * Get config with its variants and their latest versions
     * Uses multiple adapter queries instead of JOINs for database agnosticism
     */
    getConfigWithVariants: async (params: z.infer<typeof getConfigById>) => {
      const value = await getConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      // Get the config
      const config = await adapter.findOne<Config>('configs', [
        { field: 'id', value: configId },
      ]);

      if (!config) {
        return [];
      }

      // Get config_variants associations
      const configVariants = await adapter.findMany<ConfigVariant>(
        'config_variants',
        {
          where: [{ field: 'configId', value: configId }],
        }
      );

      if (configVariants.length === 0) {
        return [
          {
            id: config.id,
            slug: config.slug,
            name: config.name,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            variantId: null,
            variantName: null,
            provider: null,
            modelName: null,
            jsonData: null,
            variantVersionId: null,
          },
        ];
      }

      // Get all variants
      const variantIds = configVariants.map((cv) => cv.variantId);
      const variants = await Promise.all(
        variantIds.map((variantId) =>
          adapter.findOne<Variant>('variants', [{ field: 'id', value: variantId }])
        )
      );

      // Get latest version for each variant
      const latestVersions = await Promise.all(
        variantIds.map(async (variantId) => {
          const versions = await adapter.findMany<VariantVersion>(
            'variant_versions',
            {
              where: [{ field: 'variantId', value: variantId }],
              orderBy: [{ field: 'version', direction: 'desc' }],
              limit: 1,
            }
          );
          return versions[0] ?? null;
        })
      );

      // Combine the results
      return configVariants.map((cv, index) => {
        const variant = variants[index];
        const version = latestVersions[index];

        return {
          id: config.id,
          slug: config.slug,
          name: config.name,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
          variantId: cv.variantId,
          variantName: variant?.name ?? null,
          provider: version?.provider ?? null,
          modelName: version?.modelName ?? null,
          jsonData: version?.jsonData ?? null,
          variantVersionId: version?.id ?? null,
        };
      });
    },
  };
};
