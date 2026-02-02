import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { Playground } from '@/schemas';
import { playgroundColumnSchema } from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createNewPlayground = z.object({
  name: z.string(),
  datasetId: z.string().uuid().nullable().optional(),
  columns: z.array(playgroundColumnSchema).nullable().optional(),
});

const updatePlayground = z.object({
  playgroundId: z.uuidv4(),
  name: z.string().optional(),
  datasetId: z.string().uuid().nullable().optional(),
  columns: z.array(playgroundColumnSchema).nullable().optional(),
});

const getPlaygroundById = z.object({
  playgroundId: z.uuidv4(),
});

const deletePlayground = z.object({
  playgroundId: z.uuidv4(),
});

const listPlaygrounds = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createPlaygroundDataLayer = (adapter: Adapter) => {
  return {
    createNewPlayground: async (
      params: z.infer<typeof createNewPlayground>
    ) => {
      const value = await createNewPlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, datasetId, columns } = value.data;

      return adapter.create<Playground>('playgrounds', {
        id: randomUUID(),
        name,
        datasetId: datasetId ?? null,
        columns: columns ? JSON.stringify(columns) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    updatePlayground: async (params: z.infer<typeof updatePlayground>) => {
      const value = await updatePlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId, name, datasetId, columns } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updateData.name = name;
      if (datasetId !== undefined) updateData.datasetId = datasetId;
      if (columns !== undefined)
        updateData.columns = columns ? JSON.stringify(columns) : null;

      return adapter.update<Playground>(
        'playgrounds',
        [{ field: 'id', value: playgroundId }],
        updateData
      );
    },
    getPlaygroundById: async (params: z.infer<typeof getPlaygroundById>) => {
      const value = await getPlaygroundById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId } = value.data;

      return adapter.findOne<Playground>('playgrounds', [
        { field: 'id', value: playgroundId },
      ]);
    },
    deletePlayground: async (params: z.infer<typeof deletePlayground>) => {
      const value = await deletePlayground.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { playgroundId } = value.data;

      return adapter.delete<Playground>('playgrounds', [
        { field: 'id', value: playgroundId },
      ]);
    },
    listPlaygrounds: async (params?: z.infer<typeof listPlaygrounds>) => {
      const value = await listPlaygrounds.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<Playground>('playgrounds', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },
    countPlaygrounds: async () => {
      return adapter.count('playgrounds');
    },
  };
};
