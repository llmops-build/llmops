import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createVariant = z.object({
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()).optional().default({}),
});

const updateVariant = z.object({
  variantId: z.string().uuid(),
  provider: z.string().optional(),
  modelName: z.string().optional(),
  jsonData: z.record(z.string(), z.unknown()).optional(),
});

const getVariantById = z.object({
  variantId: z.string().uuid(),
});

const deleteVariant = z.object({
  variantId: z.string().uuid(),
});

const listVariants = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createVariantDataLayer = (db: Kysely<Database>) => {
  return {
    createVariant: async (params: z.infer<typeof createVariant>) => {
      const value = await createVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { provider, modelName, jsonData } = value.data;

      return db
        .insertInto('variants')
        .values({
          id: randomUUID(),
          provider,
          modelName,
          jsonData: JSON.stringify(jsonData),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    updateVariant: async (params: z.infer<typeof updateVariant>) => {
      const value = await updateVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, ...updates } = value.data;

      const updateData: Record<string, string> = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.provider) {
        updateData.provider = updates.provider;
      }
      if (updates.modelName) {
        updateData.modelName = updates.modelName;
      }
      if (updates.jsonData) {
        updateData.jsonData = JSON.stringify(updates.jsonData);
      }

      return db
        .updateTable('variants')
        .set(updateData)
        .where('id', '=', variantId)
        .returningAll()
        .executeTakeFirst();
    },
    getVariantById: async (params: z.infer<typeof getVariantById>) => {
      const value = await getVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      return db
        .selectFrom('variants')
        .selectAll()
        .where('id', '=', variantId)
        .executeTakeFirst();
    },
    deleteVariant: async (params: z.infer<typeof deleteVariant>) => {
      const value = await deleteVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      return db
        .deleteFrom('variants')
        .where('id', '=', variantId)
        .returningAll()
        .executeTakeFirst();
    },
    listVariants: async (params?: z.infer<typeof listVariants>) => {
      const value = await listVariants.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('variants')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
  };
};
