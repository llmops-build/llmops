import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { Environment } from '@/schemas';
import { randomUUID } from 'node:crypto';
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

export const createEnvironmentDataLayer = (adapter: Adapter) => {
  return {
    createNewEnvironment: async (
      params: z.infer<typeof createNewEnvironment>
    ) => {
      const value = await createNewEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, slug, isProd } = value.data;

      return adapter.create<Environment>('environments', {
        id: randomUUID(),
        name,
        slug,
        isProd,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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

      return adapter.update<Environment>(
        'environments',
        [{ field: 'id', value: environmentId }],
        updateData
      );
    },

    getEnvironmentById: async (params: z.infer<typeof getEnvironmentById>) => {
      const value = await getEnvironmentById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return adapter.findOne<Environment>('environments', [
        { field: 'id', value: environmentId },
      ]);
    },

    getEnvironmentBySlug: async (
      params: z.infer<typeof getEnvironmentBySlug>
    ) => {
      const value = await getEnvironmentBySlug.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { slug } = value.data;

      return adapter.findOne<Environment>('environments', [
        { field: 'slug', value: slug },
      ]);
    },

    deleteEnvironment: async (params: z.infer<typeof deleteEnvironment>) => {
      const value = await deleteEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return adapter.delete<Environment>('environments', [
        { field: 'id', value: environmentId },
      ]);
    },

    listEnvironments: async (params?: z.infer<typeof listEnvironments>) => {
      const value = await listEnvironments.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<Environment>('environments', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    countEnvironments: async () => {
      return adapter.count('environments');
    },
  };
};
