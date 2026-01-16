import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import z from 'zod';

const createVariant = z.object({
  name: z.string(),
});

const updateVariant = z.object({
  variantId: z.string().uuid(),
  name: z.string().optional(),
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
    /**
     * Create a new variant (metadata only, no version data)
     */
    createVariant: async (params: z.infer<typeof createVariant>) => {
      const value = await createVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name } = value.data;

      return db
        .insertInto('variants')
        .values({
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Update variant metadata (name only)
     */
    updateVariant: async (params: z.infer<typeof updateVariant>) => {
      const value = await updateVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, ...updates } = value.data;

      const updateData: Record<string, string> = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.name) {
        updateData.name = updates.name;
      }

      return db
        .updateTable('variants')
        .set(updateData)
        .where('id', '=', variantId)
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Get variant by ID (metadata only)
     */
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

    /**
     * Get variant with its latest version data
     */
    getVariantWithLatestVersion: async (
      params: z.infer<typeof getVariantById>
    ) => {
      const value = await getVariantById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      // Get the variant with its latest version
      const variant = await db
        .selectFrom('variants')
        .selectAll()
        .where('id', '=', variantId)
        .executeTakeFirst();

      if (!variant) {
        return undefined;
      }

      const latestVersion = await db
        .selectFrom('variant_versions')
        .selectAll()
        .where('variantId', '=', variantId)
        .orderBy('version', 'desc')
        .limit(1)
        .executeTakeFirst();

      return {
        ...variant,
        latestVersion: latestVersion ?? null,
      };
    },

    /**
     * Delete variant and all its versions
     */
    deleteVariant: async (params: z.infer<typeof deleteVariant>) => {
      const value = await deleteVariant.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      // First delete all versions
      await db
        .deleteFrom('variant_versions')
        .where('variantId', '=', variantId)
        .execute();

      // Then delete the variant
      return db
        .deleteFrom('variants')
        .where('id', '=', variantId)
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * List all variants (metadata only)
     */
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

    /**
     * List all variants with their latest version data
     */
    listVariantsWithLatestVersion: async (
      params?: z.infer<typeof listVariants>
    ) => {
      const value = await listVariants.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      // Get variants
      const variants = await db
        .selectFrom('variants')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      if (variants.length === 0) {
        return [];
      }

      // Get latest version for each variant individually
      const variantsWithVersions = await Promise.all(
        variants.map(async (variant) => {
          const latestVersion = await db
            .selectFrom('variant_versions')
            .selectAll()
            .where('variantId', '=', variant.id)
            .orderBy('version', 'desc')
            .limit(1)
            .executeTakeFirst();

          return {
            ...variant,
            latestVersion: latestVersion ?? null,
          };
        })
      );

      return variantsWithVersions;
    },
  };
};
