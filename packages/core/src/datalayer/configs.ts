import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

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
          id: randomUUID(),
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
      const { limit = 50, offset = 0 } = value.data;

      return db
        .selectFrom('configs')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    getConfigWithVariants: async (params: z.infer<typeof getConfigById>) => {
      const value = await getConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return db
        .selectFrom('configs')
        .leftJoin('config_variants', 'configs.id', 'config_variants.configId')
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'configs.id',
          'configs.name',
          'configs.createdAt',
          'configs.updatedAt',
          'variants.id as variantId',
          'variants.provider',
          'variants.modelName',
          'variants.jsonData',
        ])
        .where('configs.id', '=', configId)
        .execute();
    },
  };
};
