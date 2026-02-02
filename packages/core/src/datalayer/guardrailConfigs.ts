import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { GuardrailConfig } from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createGuardrailConfig = z.object({
  name: z.string().min(1),
  pluginId: z.string().min(1),
  functionId: z.string().min(1),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  parameters: z.record(z.string(), z.unknown()).optional().default({}),
  enabled: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
  onFail: z.enum(['block', 'log']).optional().default('block'),
});

const updateGuardrailConfig = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
  onFail: z.enum(['block', 'log']).optional(),
});

const getGuardrailConfigById = z.object({
  id: z.string().uuid(),
});

const deleteGuardrailConfig = z.object({
  id: z.string().uuid(),
});

const listGuardrailConfigs = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']).optional(),
  enabled: z.boolean().optional(),
});

export const createGuardrailConfigsDataLayer = (adapter: Adapter) => {
  return {
    createGuardrailConfig: async (
      params: z.infer<typeof createGuardrailConfig>
    ) => {
      const value = await createGuardrailConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const {
        name,
        pluginId,
        functionId,
        hookType,
        parameters,
        enabled,
        priority,
        onFail,
      } = value.data;

      return adapter.create<GuardrailConfig>('guardrail_configs', {
        id: randomUUID(),
        name,
        pluginId,
        functionId,
        hookType,
        parameters: JSON.stringify(parameters),
        enabled,
        priority,
        onFail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    updateGuardrailConfig: async (
      params: z.infer<typeof updateGuardrailConfig>
    ) => {
      const value = await updateGuardrailConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id, name, hookType, parameters, enabled, priority, onFail } =
        value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updateData.name = name;
      if (hookType !== undefined) updateData.hookType = hookType;
      if (parameters !== undefined)
        updateData.parameters = JSON.stringify(parameters);
      if (enabled !== undefined) updateData.enabled = enabled;
      if (priority !== undefined) updateData.priority = priority;
      if (onFail !== undefined) updateData.onFail = onFail;

      return adapter.update<GuardrailConfig>(
        'guardrail_configs',
        [{ field: 'id', value: id }],
        updateData
      );
    },

    getGuardrailConfigById: async (
      params: z.infer<typeof getGuardrailConfigById>
    ) => {
      const value = await getGuardrailConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.findOne<GuardrailConfig>('guardrail_configs', [
        { field: 'id', value: id },
      ]);
    },

    deleteGuardrailConfig: async (
      params: z.infer<typeof deleteGuardrailConfig>
    ) => {
      const value = await deleteGuardrailConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.delete<GuardrailConfig>('guardrail_configs', [
        { field: 'id', value: id },
      ]);
    },

    listGuardrailConfigs: async (
      params?: z.infer<typeof listGuardrailConfigs>
    ) => {
      const value = await listGuardrailConfigs.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0, hookType, enabled } = value.data;

      const where: Array<{ field: string; value: string | boolean }> = [];
      if (hookType !== undefined) {
        where.push({ field: 'hookType', value: hookType });
      }
      if (enabled !== undefined) {
        where.push({ field: 'enabled', value: enabled });
      }

      return adapter.findMany<GuardrailConfig>('guardrail_configs', {
        where: where.length > 0 ? where : undefined,
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        limit,
        offset,
      });
    },

    countGuardrailConfigs: async () => {
      return adapter.count('guardrail_configs');
    },

    /**
     * Get all enabled guardrails for a specific hook type
     * Ordered by priority (highest first)
     */
    getEnabledGuardrailsByHookType: async (
      hookType: 'beforeRequestHook' | 'afterRequestHook'
    ) => {
      return adapter.findMany<GuardrailConfig>('guardrail_configs', {
        where: [
          { field: 'hookType', value: hookType },
          { field: 'enabled', value: true },
        ],
        orderBy: [{ field: 'priority', direction: 'desc' }],
      });
    },
  };
};
