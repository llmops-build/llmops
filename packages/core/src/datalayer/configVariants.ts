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
    listConfigVariants: async (
      params?: z.infer<typeof listConfigVariants>
    ) => {
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
  };
};
