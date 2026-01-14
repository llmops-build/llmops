import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createNewPlayground = z.object({
  name: z.string(),
  description: z.string().optional(),
  state: z.record(z.string(), z.unknown()).optional(),
});

const updatePlayground = z.object({
  playgroundId: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  state: z.record(z.string(), z.unknown()).optional(),
});

const getPlaygroundById = z.object({
  playgroundId: z.string().uuid(),
});

const deletePlayground = z.object({
  playgroundId: z.string().uuid(),
});

const listPlaygrounds = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createPlaygroundDataLayer = (db: Kysely<Database>) => {
  return {
    createNewPlayground: async (
      params: z.infer<typeof createNewPlayground>
    ) => {
      const value = await createNewPlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, description, state } = value.data;

      return db
        .insertInto('playgrounds')
        .values({
          id: randomUUID(),
          name,
          description: description ?? null,
          state: JSON.stringify(state ?? {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    updatePlayground: async (params: z.infer<typeof updatePlayground>) => {
      const value = await updatePlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId, name, description, state } = value.data;

      return db
        .updateTable('playgrounds')
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(state !== undefined ? { state: JSON.stringify(state) } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', playgroundId)
        .returningAll()
        .executeTakeFirst();
    },

    getPlaygroundById: async (params: z.infer<typeof getPlaygroundById>) => {
      const value = await getPlaygroundById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId } = value.data;

      return db
        .selectFrom('playgrounds')
        .selectAll()
        .where('id', '=', playgroundId)
        .executeTakeFirst();
    },

    deletePlayground: async (params: z.infer<typeof deletePlayground>) => {
      const value = await deletePlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId } = value.data;

      return db
        .deleteFrom('playgrounds')
        .where('id', '=', playgroundId)
        .returningAll()
        .executeTakeFirst();
    },

    listPlaygrounds: async (params?: z.infer<typeof listPlaygrounds>) => {
      const value = await listPlaygrounds.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('playgrounds')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
  };
};
