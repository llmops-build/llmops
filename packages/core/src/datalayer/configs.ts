import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import z from 'zod';

/**
 * Generate a short unique ID for configs (8 characters, URL-safe)
 * Uses base62 encoding (a-z, A-Z, 0-9) for shorter, readable IDs
 */
function generateShortId(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
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

export const createConfigDataLayer = (db: Kysely<Database>) => {
  return {
    createNewConfig: async (params: z.infer<typeof createNewConfig>) => {
      const value = await createNewConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name } = value.data;

      return db
        .insertInto('configs')
        .values({
          id: crypto.randomUUID(),
          slug: generateShortId(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    updateConfigName: async (params: z.infer<typeof updateConfigName>) => {
      const value = await updateConfigName.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { newName, configId } = value.data;

      return db
        .updateTable('configs')
        .set({
          name: newName,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', configId)
        .returningAll()
        .executeTakeFirst();
    },
    getConfigById: async (params: z.infer<typeof getConfigById>) => {
      const value = await getConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return db
        .selectFrom('configs')
        .selectAll()
        .where('id', '=', configId)
        .executeTakeFirst();
    },
    deleteConfig: async (params: z.infer<typeof deleteConfig>) => {
      const value = await deleteConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return db
        .deleteFrom('configs')
        .where('id', '=', configId)
        .returningAll()
        .executeTakeFirst();
    },
    listConfigs: async (params?: z.infer<typeof listConfigs>) => {
      const value = await listConfigs.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('configs')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    /**
     * Get config with its variants and their latest versions
     */
    getConfigWithVariants: async (params: z.infer<typeof getConfigById>) => {
      const value = await getConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      // First get the config with basic variant info
      const configData = await db
        .selectFrom('configs')
        .leftJoin('config_variants', 'configs.id', 'config_variants.configId')
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'configs.id',
          'configs.slug',
          'configs.name',
          'configs.createdAt',
          'configs.updatedAt',
          'variants.id as variantId',
          'variants.name as variantName',
        ])
        .where('configs.id', '=', configId)
        .execute();

      // Get latest versions for each variant
      const variantIds = configData
        .map((row) => row.variantId)
        .filter((id): id is string => id !== null);

      if (variantIds.length === 0) {
        return configData.map((row) => ({
          ...row,
          provider: null,
          modelName: null,
          jsonData: null,
        }));
      }

      // Get latest version for each variant
      const latestVersions = await Promise.all(
        variantIds.map((variantId) =>
          db
            .selectFrom('variant_versions')
            .selectAll()
            .where('variantId', '=', variantId)
            .orderBy('version', 'desc')
            .limit(1)
            .executeTakeFirst()
        )
      );

      const versionMap = new Map(
        latestVersions
          .filter((v): v is NonNullable<typeof v> => v !== undefined)
          .map((v) => [v.variantId, v])
      );

      return configData.map((row) => {
        const version = row.variantId ? versionMap.get(row.variantId) : null;
        return {
          ...row,
          provider: version?.provider ?? null,
          modelName: version?.modelName ?? null,
          jsonData: version?.jsonData ?? null,
        };
      });
    },
  };
};
