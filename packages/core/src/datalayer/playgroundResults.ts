import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { PlaygroundResult } from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createPlaygroundResult = z.object({
  runId: z.string().uuid(),
  columnId: z.string().uuid(),
  datasetRecordId: z.string().uuid().nullable().optional(),
  inputVariables: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
});

const createPlaygroundResultsBatch = z.object({
  results: z.array(createPlaygroundResult),
});

const updatePlaygroundResult = z.object({
  resultId: z.string().uuid(),
  outputContent: z.string().nullable().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  error: z.string().nullable().optional(),
  latencyMs: z.number().int().nullable().optional(),
  promptTokens: z.number().int().nullable().optional(),
  completionTokens: z.number().int().nullable().optional(),
  totalTokens: z.number().int().nullable().optional(),
  cost: z.number().int().nullable().optional(),
});

const getPlaygroundResultById = z.object({
  resultId: z.string().uuid(),
});

const listPlaygroundResults = z.object({
  runId: z.string().uuid(),
  columnId: z.string().uuid().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const deletePlaygroundResultsByRunId = z.object({
  runId: z.string().uuid(),
});

export const createPlaygroundResultsDataLayer = (adapter: Adapter) => {
  return {
    createPlaygroundResult: async (
      params: z.infer<typeof createPlaygroundResult>
    ) => {
      const value = await createPlaygroundResult.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId, columnId, datasetRecordId, inputVariables, status } =
        value.data;

      return adapter.create<PlaygroundResult>('playground_results', {
        id: randomUUID(),
        runId,
        columnId,
        datasetRecordId: datasetRecordId ?? null,
        inputVariables: JSON.stringify(inputVariables),
        outputContent: null,
        status,
        error: null,
        latencyMs: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        cost: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    createPlaygroundResultsBatch: async (
      params: z.infer<typeof createPlaygroundResultsBatch>
    ) => {
      const value = await createPlaygroundResultsBatch.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { results } = value.data;

      if (results.length === 0) {
        return [];
      }

      const now = new Date().toISOString();
      const values = results.map((result) => ({
        id: randomUUID(),
        runId: result.runId,
        columnId: result.columnId,
        datasetRecordId: result.datasetRecordId ?? null,
        inputVariables: JSON.stringify(result.inputVariables),
        outputContent: null,
        status: result.status,
        error: null,
        latencyMs: null,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        cost: null,
        createdAt: now,
        updatedAt: now,
      }));

      return adapter.createMany<PlaygroundResult>('playground_results', values);
    },

    updatePlaygroundResult: async (
      params: z.infer<typeof updatePlaygroundResult>
    ) => {
      const value = await updatePlaygroundResult.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const {
        resultId,
        outputContent,
        status,
        error,
        latencyMs,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
      } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (outputContent !== undefined) updateData.outputContent = outputContent;
      if (status !== undefined) updateData.status = status;
      if (error !== undefined) updateData.error = error;
      if (latencyMs !== undefined) updateData.latencyMs = latencyMs;
      if (promptTokens !== undefined) updateData.promptTokens = promptTokens;
      if (completionTokens !== undefined)
        updateData.completionTokens = completionTokens;
      if (totalTokens !== undefined) updateData.totalTokens = totalTokens;
      if (cost !== undefined) updateData.cost = cost;

      return adapter.update<PlaygroundResult>(
        'playground_results',
        [{ field: 'id', value: resultId }],
        updateData
      );
    },

    getPlaygroundResultById: async (
      params: z.infer<typeof getPlaygroundResultById>
    ) => {
      const value = await getPlaygroundResultById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { resultId } = value.data;

      return adapter.findOne<PlaygroundResult>('playground_results', [
        { field: 'id', value: resultId },
      ]);
    },

    listPlaygroundResults: async (
      params: z.infer<typeof listPlaygroundResults>
    ) => {
      const value = await listPlaygroundResults.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId, columnId, limit = 500, offset = 0 } = value.data;

      const where: Array<{ field: string; value: string }> = [
        { field: 'runId', value: runId },
      ];
      if (columnId) {
        where.push({ field: 'columnId', value: columnId });
      }

      return adapter.findMany<PlaygroundResult>('playground_results', {
        where,
        orderBy: [{ field: 'createdAt', direction: 'asc' }],
        limit,
        offset,
      });
    },

    deletePlaygroundResultsByRunId: async (
      params: z.infer<typeof deletePlaygroundResultsByRunId>
    ) => {
      const value = await deletePlaygroundResultsByRunId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { runId } = value.data;

      // First get the results to return them
      const results = await adapter.findMany<PlaygroundResult>(
        'playground_results',
        {
          where: [{ field: 'runId', value: runId }],
        }
      );

      // Then delete them
      await adapter.deleteMany('playground_results', [
        { field: 'runId', value: runId },
      ]);

      return results;
    },

    countPlaygroundResults: async (runId: string) => {
      return adapter.count('playground_results', [
        { field: 'runId', value: runId },
      ]);
    },

    countCompletedPlaygroundResults: async (runId: string) => {
      return adapter.count('playground_results', [
        { field: 'runId', value: runId },
        { field: 'status', value: 'completed' },
      ]);
    },
  };
};
