import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { Variant, VariantVersion } from '@/schemas';
import { randomUUID } from 'node:crypto';
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

export const createVariantDataLayer = (adapter: Adapter) => {
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

      return adapter.create<Variant>('variants', {
        id: randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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

      return adapter.update<Variant>(
        'variants',
        [{ field: 'id', value: variantId }],
        updateData
      );
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

      return adapter.findOne<Variant>('variants', [
        { field: 'id', value: variantId },
      ]);
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

      // Get the variant
      const variant = await adapter.findOne<Variant>('variants', [
        { field: 'id', value: variantId },
      ]);

      if (!variant) {
        return undefined;
      }

      // Get the latest version
      const versions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: variantId }],
          orderBy: [{ field: 'version', direction: 'desc' }],
          limit: 1,
        }
      );

      return {
        ...variant,
        latestVersion: versions[0] ?? null,
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
      await adapter.deleteMany('variant_versions', [
        { field: 'variantId', value: variantId },
      ]);

      // Then delete the variant
      return adapter.delete<Variant>('variants', [
        { field: 'id', value: variantId },
      ]);
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

      return adapter.findMany<Variant>('variants', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
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
      const variants = await adapter.findMany<Variant>('variants', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });

      if (variants.length === 0) {
        return [];
      }

      // Get latest version for each variant individually
      const variantsWithVersions = await Promise.all(
        variants.map(async (variant) => {
          const versions = await adapter.findMany<VariantVersion>(
            'variant_versions',
            {
              where: [{ field: 'variantId', value: variant.id }],
              orderBy: [{ field: 'version', direction: 'desc' }],
              limit: 1,
            }
          );

          return {
            ...variant,
            latestVersion: versions[0] ?? null,
          };
        })
      );

      return variantsWithVersions;
    },
  };
};
