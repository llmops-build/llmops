import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

/**
 * Generate a unique slug for a provider config.
 * If the base slug already exists, appends -01, -02, etc.
 */
async function generateUniqueSlug(
  db: Kysely<Database>,
  baseSlug: string
): Promise<string> {
  // Check if base slug exists
  const existing = await db
    .selectFrom('provider_configs')
    .select('slug')
    .where('slug', 'like', `${baseSlug}%`)
    .execute();

  if (existing.length === 0) {
    return baseSlug;
  }

  const existingSlugs = new Set(existing.map((e) => e.slug));

  // If base slug doesn't exist, use it
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Find the next available suffix
  let counter = 1;
  while (counter < 100) {
    const suffix = counter.toString().padStart(2, '0');
    const candidateSlug = `${baseSlug}-${suffix}`;
    if (!existingSlugs.has(candidateSlug)) {
      return candidateSlug;
    }
    counter++;
  }

  // Fallback: use UUID suffix
  return `${baseSlug}-${randomUUID().slice(0, 8)}`;
}

const createProviderConfig = z.object({
  providerId: z.string().min(1),
  slug: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional().default(true),
});

const updateProviderConfig = z.object({
  id: z.uuidv4(),
  slug: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

const getProviderConfigById = z.object({
  id: z.uuidv4(),
});

const getProviderConfigByProviderId = z.object({
  providerId: z.string().min(1),
});

const deleteProviderConfig = z.object({
  id: z.uuidv4(),
});

const listProviderConfigs = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createProviderConfigsDataLayer = (db: Kysely<Database>) => {
  return {
    createProviderConfig: async (
      params: z.infer<typeof createProviderConfig>
    ) => {
      const value = await createProviderConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerId, slug, name, config, enabled } = value.data;

      // Auto-generate unique slug if not provided
      const finalSlug = slug ?? (await generateUniqueSlug(db, providerId));

      return db
        .insertInto('provider_configs')
        .values({
          id: randomUUID(),
          providerId,
          slug: finalSlug,
          name: name ?? null,
          config: JSON.stringify(config),
          enabled,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    updateProviderConfig: async (
      params: z.infer<typeof updateProviderConfig>
    ) => {
      const value = await updateProviderConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id, slug, name, config, enabled } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (slug !== undefined) updateData.slug = slug;
      if (name !== undefined) updateData.name = name;
      if (config !== undefined) updateData.config = JSON.stringify(config);
      if (enabled !== undefined) updateData.enabled = enabled;

      return db
        .updateTable('provider_configs')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },
    getProviderConfigById: async (
      params: z.infer<typeof getProviderConfigById>
    ) => {
      const value = await getProviderConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .selectFrom('provider_configs')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    },
    getProviderConfigByProviderId: async (
      params: z.infer<typeof getProviderConfigByProviderId>
    ) => {
      const value = await getProviderConfigByProviderId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerId } = value.data;

      return db
        .selectFrom('provider_configs')
        .selectAll()
        .where('providerId', '=', providerId)
        .executeTakeFirst();
    },
    deleteProviderConfig: async (
      params: z.infer<typeof deleteProviderConfig>
    ) => {
      const value = await deleteProviderConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .deleteFrom('provider_configs')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },
    listProviderConfigs: async (
      params?: z.infer<typeof listProviderConfigs>
    ) => {
      const value = await listProviderConfigs.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('provider_configs')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    countProviderConfigs: async () => {
      const result = await db
        .selectFrom('provider_configs')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },
    /**
     * Upsert provider config - creates if not exists, updates if exists
     * Useful for the dashboard UI where you want to set/update a provider config
     */
    upsertProviderConfig: async (
      params: z.infer<typeof createProviderConfig>
    ) => {
      const value = await createProviderConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerId, slug, name, config, enabled } = value.data;

      // Check if a config already exists for this provider
      const existing = await db
        .selectFrom('provider_configs')
        .selectAll()
        .where('providerId', '=', providerId)
        .executeTakeFirst();

      if (existing) {
        // Update existing config
        // Generate slug if not provided and existing doesn't have one
        const finalSlug =
          slug ?? existing.slug ?? (await generateUniqueSlug(db, providerId));

        return db
          .updateTable('provider_configs')
          .set({
            slug: finalSlug,
            name: name ?? existing.name,
            config: JSON.stringify(config),
            enabled,
            updatedAt: new Date().toISOString(),
          })
          .where('id', '=', existing.id)
          .returningAll()
          .executeTakeFirst();
      }

      // Auto-generate unique slug if not provided for new configs
      const finalSlug = slug ?? (await generateUniqueSlug(db, providerId));

      // Create new config
      return db
        .insertInto('provider_configs')
        .values({
          id: randomUUID(),
          providerId,
          slug: finalSlug,
          name: name ?? null,
          config: JSON.stringify(config),
          enabled,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
  };
};
