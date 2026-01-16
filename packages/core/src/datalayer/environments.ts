import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import z from 'zod';

const createNewEnvironment = z.object({
  name: z.string(),
  slug: z.string(),
  isProd: z.boolean().optional().default(false),
});

const updateEnvironment = z.object({
  environmentId: z.uuidv4(),
  name: z.string().optional(),
  slug: z.string().optional(),
});

const getEnvironmentById = z.object({
  environmentId: z.uuidv4(),
});

const getEnvironmentBySlug = z.object({
  slug: z.string(),
});

const deleteEnvironment = z.object({
  environmentId: z.uuidv4(),
});

const listEnvironments = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createEnvironmentDataLayer = (db: Kysely<Database>) => {
  return {
    createNewEnvironment: async (
      params: z.infer<typeof createNewEnvironment>
    ) => {
      const value = await createNewEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, slug, isProd } = value.data;

      return db
        .insertInto('environments')
        .values({
          id: crypto.randomUUID(),
          name,
          slug,
          isProd,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    updateEnvironment: async (params: z.infer<typeof updateEnvironment>) => {
      const value = await updateEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId, name, slug } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;

      return db
        .updateTable('environments')
        .set(updateData)
        .where('id', '=', environmentId)
        .returningAll()
        .executeTakeFirst();
    },
    getEnvironmentById: async (params: z.infer<typeof getEnvironmentById>) => {
      const value = await getEnvironmentById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return db
        .selectFrom('environments')
        .selectAll()
        .where('id', '=', environmentId)
        .executeTakeFirst();
    },
    getEnvironmentBySlug: async (
      params: z.infer<typeof getEnvironmentBySlug>
    ) => {
      const value = await getEnvironmentBySlug.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { slug } = value.data;

      return db
        .selectFrom('environments')
        .selectAll()
        .where('slug', '=', slug)
        .executeTakeFirst();
    },
    deleteEnvironment: async (params: z.infer<typeof deleteEnvironment>) => {
      const value = await deleteEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return db
        .deleteFrom('environments')
        .where('id', '=', environmentId)
        .returningAll()
        .executeTakeFirst();
    },
    listEnvironments: async (params?: z.infer<typeof listEnvironments>) => {
      const value = await listEnvironments.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('environments')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    countEnvironments: async () => {
      const result = await db
        .selectFrom('environments')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },
  };
};
