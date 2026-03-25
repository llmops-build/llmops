import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
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

export const createGuardrailConfigsDataLayer = (db: Kysely<Database>) => {
  return {
    createGuardrailConfig: async (
      params: z.infer<typeof createGuardrailConfig>,
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

      return db
        .insertInto('guardrail_configs')
        .values({
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
        })
        .returningAll()
        .executeTakeFirst();
    },

    updateGuardrailConfig: async (
      params: z.infer<typeof updateGuardrailConfig>,
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

      return db
        .updateTable('guardrail_configs')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    getGuardrailConfigById: async (
      params: z.infer<typeof getGuardrailConfigById>,
    ) => {
      const value = await getGuardrailConfigById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .selectFrom('guardrail_configs')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    },

    deleteGuardrailConfig: async (
      params: z.infer<typeof deleteGuardrailConfig>,
    ) => {
      const value = await deleteGuardrailConfig.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .deleteFrom('guardrail_configs')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    listGuardrailConfigs: async (
      params?: z.infer<typeof listGuardrailConfigs>,
    ) => {
      const value = await listGuardrailConfigs.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0, hookType, enabled } = value.data;

      let query = db
        .selectFrom('guardrail_configs')
        .selectAll()
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      if (hookType !== undefined) {
        query = query.where('hookType', '=', hookType);
      }
      if (enabled !== undefined) {
        query = query.where('enabled', '=', enabled);
      }

      return query.execute();
    },

    countGuardrailConfigs: async () => {
      const result = await db
        .selectFrom('guardrail_configs')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },

    /**
     * Get all enabled guardrails for a specific hook type
     * Ordered by priority (highest first)
     */
    getEnabledGuardrailsByHookType: async (
      hookType: 'beforeRequestHook' | 'afterRequestHook',
    ) => {
      return db
        .selectFrom('guardrail_configs')
        .selectAll()
        .where('hookType', '=', hookType)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .execute();
    },
  };
};
