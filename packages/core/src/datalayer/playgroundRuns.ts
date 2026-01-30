import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createPlaygroundRun = z.object({
  playgroundId: z.string().uuid(),
  datasetId: z.string().uuid().nullable().optional(),
  datasetVersionId: z.string().uuid().nullable().optional(),
  status: z
    .enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
    .default('pending'),
  totalRecords: z.number().int().default(0),
});

const updatePlaygroundRun = z.object({
  runId: z.string().uuid(),
  status: z
    .enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
    .optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  completedRecords: z.number().int().optional(),
});

const getPlaygroundRunById = z.object({
  runId: z.string().uuid(),
});

const listPlaygroundRuns = z.object({
  playgroundId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const deletePlaygroundRun = z.object({
  runId: z.string().uuid(),
});

export const createPlaygroundRunsDataLayer = (db: Kysely<Database>) => {
  return {
    createPlaygroundRun: async (
      params: z.infer<typeof createPlaygroundRun>
    ) => {
      const value = await createPlaygroundRun.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId, datasetId, datasetVersionId, status, totalRecords } =
        value.data;

      return db
        .insertInto('playground_runs')
        .values({
          id: randomUUID(),
          playgroundId,
          datasetId: datasetId ?? null,
          datasetVersionId: datasetVersionId ?? null,
          status,
          startedAt: null,
          completedAt: null,
          totalRecords,
          completedRecords: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    updatePlaygroundRun: async (
      params: z.infer<typeof updatePlaygroundRun>
    ) => {
      const value = await updatePlaygroundRun.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId, status, startedAt, completedAt, completedRecords } =
        value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (status !== undefined) updateData.status = status;
      if (startedAt !== undefined)
        updateData.startedAt = startedAt?.toISOString() ?? null;
      if (completedAt !== undefined)
        updateData.completedAt = completedAt?.toISOString() ?? null;
      if (completedRecords !== undefined)
        updateData.completedRecords = completedRecords;

      return db
        .updateTable('playground_runs')
        .set(updateData)
        .where('id', '=', runId)
        .returningAll()
        .executeTakeFirst();
    },

    getPlaygroundRunById: async (
      params: z.infer<typeof getPlaygroundRunById>
    ) => {
      const value = await getPlaygroundRunById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId } = value.data;

      return db
        .selectFrom('playground_runs')
        .selectAll()
        .where('id', '=', runId)
        .executeTakeFirst();
    },

    listPlaygroundRuns: async (params: z.infer<typeof listPlaygroundRuns>) => {
      const value = await listPlaygroundRuns.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId, limit = 50, offset = 0 } = value.data;

      return db
        .selectFrom('playground_runs')
        .selectAll()
        .where('playgroundId', '=', playgroundId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },

    deletePlaygroundRun: async (
      params: z.infer<typeof deletePlaygroundRun>
    ) => {
      const value = await deletePlaygroundRun.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId } = value.data;

      return db
        .deleteFrom('playground_runs')
        .where('id', '=', runId)
        .returningAll()
        .executeTakeFirst();
    },

    countPlaygroundRuns: async (playgroundId: string) => {
      const result = await db
        .selectFrom('playground_runs')
        .select(db.fn.countAll().as('count'))
        .where('playgroundId', '=', playgroundId)
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },
  };
};
