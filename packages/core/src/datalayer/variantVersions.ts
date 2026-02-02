import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { Variant, VariantVersion } from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createVariantVersion = z.object({
  variantId: z.string().uuid(),
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()).optional().default({}),
});

const getVariantVersionById = z.object({
  id: z.string().uuid(),
});

const getVariantVersionsByVariantId = z.object({
  variantId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const getLatestVariantVersion = z.object({
  variantId: z.string().uuid(),
});

const getVariantVersionByNumber = z.object({
  variantId: z.string().uuid(),
  version: z.number().int().positive(),
});

const deleteVariantVersion = z.object({
  id: z.string().uuid(),
});

export const createVariantVersionsDataLayer = (adapter: Adapter) => {
  return {
    /**
     * Create a new version for a variant.
     * Auto-increments the version number based on existing versions.
     */
    createVariantVersion: async (
      params: z.infer<typeof createVariantVersion>
    ) => {
      const value = await createVariantVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, provider, modelName, jsonData } = value.data;

      // Get the latest version number for this variant
      const existingVersions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: variantId }],
          orderBy: [{ field: 'version', direction: 'desc' }],
          limit: 1,
        }
      );

      const latestVersion = existingVersions[0];
      const newVersionNumber = (latestVersion?.version ?? 0) + 1;
      const now = new Date().toISOString();

      return adapter.create<VariantVersion>('variant_versions', {
        id: randomUUID(),
        variantId,
        version: newVersionNumber,
        provider,
        modelName,
        jsonData: JSON.stringify(jsonData),
        createdAt: now,
        updatedAt: now,
      });
    },

    /**
     * Get a specific version by its UUID
     */
    getVariantVersionById: async (
      params: z.infer<typeof getVariantVersionById>
    ) => {
      const value = await getVariantVersionById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.findOne<VariantVersion>('variant_versions', [
        { field: 'id', value: id },
      ]);
    },

    /**
     * Get all versions for a variant, ordered by version number descending (latest first)
     */
    getVariantVersionsByVariantId: async (
      params: z.infer<typeof getVariantVersionsByVariantId>
    ) => {
      const value = await getVariantVersionsByVariantId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<VariantVersion>('variant_versions', {
        where: [{ field: 'variantId', value: variantId }],
        orderBy: [{ field: 'version', direction: 'desc' }],
        limit,
        offset,
      });
    },

    /**
     * Get the latest version for a variant
     */
    getLatestVariantVersion: async (
      params: z.infer<typeof getLatestVariantVersion>
    ) => {
      const value = await getLatestVariantVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      const versions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: variantId }],
          orderBy: [{ field: 'version', direction: 'desc' }],
          limit: 1,
        }
      );

      return versions[0] ?? undefined;
    },

    /**
     * Get a specific version by variant ID and version number
     */
    getVariantVersionByNumber: async (
      params: z.infer<typeof getVariantVersionByNumber>
    ) => {
      const value = await getVariantVersionByNumber.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, version } = value.data;

      return adapter.findOne<VariantVersion>('variant_versions', [
        { field: 'variantId', value: variantId },
        { field: 'version', value: version },
      ]);
    },

    /**
     * Delete a specific version (use with caution, may break targeting rules)
     */
    deleteVariantVersion: async (
      params: z.infer<typeof deleteVariantVersion>
    ) => {
      const value = await deleteVariantVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.delete<VariantVersion>('variant_versions', [
        { field: 'id', value: id },
      ]);
    },

    /**
     * Delete all versions for a variant (typically when deleting the variant itself)
     */
    deleteVariantVersionsByVariantId: async (
      params: z.infer<typeof getLatestVariantVersion>
    ) => {
      const value = await getLatestVariantVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId } = value.data;

      // Get all versions first to return them
      const versions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: variantId }],
        }
      );

      // Delete all versions
      await adapter.deleteMany('variant_versions', [
        { field: 'variantId', value: variantId },
      ]);

      return versions;
    },

    /**
     * Get version with variant metadata (name)
     */
    getVariantVersionWithVariant: async (
      params: z.infer<typeof getVariantVersionById>
    ) => {
      const value = await getVariantVersionById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      // Get the version
      const version = await adapter.findOne<VariantVersion>('variant_versions', [
        { field: 'id', value: id },
      ]);

      if (!version) {
        return undefined;
      }

      // Get the variant
      const variant = await adapter.findOne<Variant>('variants', [
        { field: 'id', value: version.variantId },
      ]);

      return {
        ...version,
        variantName: variant?.name ?? null,
      };
    },

    /**
     * Get all versions for a variant with variant metadata
     */
    getVariantVersionsWithVariantByVariantId: async (
      params: z.infer<typeof getVariantVersionsByVariantId>
    ) => {
      const value = await getVariantVersionsByVariantId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { variantId, limit = 100, offset = 0 } = value.data;

      // Get the variant
      const variant = await adapter.findOne<Variant>('variants', [
        { field: 'id', value: variantId },
      ]);

      // Get all versions
      const versions = await adapter.findMany<VariantVersion>(
        'variant_versions',
        {
          where: [{ field: 'variantId', value: variantId }],
          orderBy: [{ field: 'version', direction: 'desc' }],
          limit,
          offset,
        }
      );

      return versions.map((version) => ({
        ...version,
        variantName: variant?.name ?? null,
      }));
    },
  };
};
