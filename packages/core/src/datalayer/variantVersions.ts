import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
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

export const createVariantVersionsDataLayer = (db: Kysely<Database>) => {
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
      const latestVersion = await db
        .selectFrom('variant_versions')
        .select('version')
        .where('variantId', '=', variantId)
        .orderBy('version', 'desc')
        .limit(1)
        .executeTakeFirst();

      const newVersionNumber = (latestVersion?.version ?? 0) + 1;
      const now = new Date().toISOString();

      return db
        .insertInto('variant_versions')
        .values({
          id: crypto.randomUUID(),
          variantId,
          version: newVersionNumber,
          provider,
          modelName,
          jsonData: JSON.stringify(jsonData),
          createdAt: now,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirst();
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

      return db
        .selectFrom('variant_versions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
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

      return db
        .selectFrom('variant_versions')
        .selectAll()
        .where('variantId', '=', variantId)
        .orderBy('version', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
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

      return db
        .selectFrom('variant_versions')
        .selectAll()
        .where('variantId', '=', variantId)
        .orderBy('version', 'desc')
        .limit(1)
        .executeTakeFirst();
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

      return db
        .selectFrom('variant_versions')
        .selectAll()
        .where('variantId', '=', variantId)
        .where('version', '=', version)
        .executeTakeFirst();
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

      return db
        .deleteFrom('variant_versions')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
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

      return db
        .deleteFrom('variant_versions')
        .where('variantId', '=', variantId)
        .returningAll()
        .execute();
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

      return db
        .selectFrom('variant_versions')
        .innerJoin('variants', 'variant_versions.variantId', 'variants.id')
        .select([
          'variant_versions.id',
          'variant_versions.variantId',
          'variant_versions.version',
          'variant_versions.provider',
          'variant_versions.modelName',
          'variant_versions.jsonData',
          'variant_versions.createdAt',
          'variant_versions.updatedAt',
          'variants.name as variantName',
        ])
        .where('variant_versions.id', '=', id)
        .executeTakeFirst();
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

      return db
        .selectFrom('variant_versions')
        .innerJoin('variants', 'variant_versions.variantId', 'variants.id')
        .select([
          'variant_versions.id',
          'variant_versions.variantId',
          'variant_versions.version',
          'variant_versions.provider',
          'variant_versions.modelName',
          'variant_versions.jsonData',
          'variant_versions.createdAt',
          'variant_versions.updatedAt',
          'variants.name as variantName',
        ])
        .where('variant_versions.variantId', '=', variantId)
        .orderBy('variant_versions.version', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
  };
};
