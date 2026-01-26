import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createProviderGuardrailOverride = z.object({
  providerConfigId: z.string().uuid(),
  guardrailConfigId: z.string().uuid(),
  enabled: z.boolean().optional().default(true),
  parameters: z.record(z.string(), z.unknown()).nullable().optional(),
});

const updateProviderGuardrailOverride = z.object({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
  parameters: z.record(z.string(), z.unknown()).nullable().optional(),
});

const getOverrideById = z.object({
  id: z.string().uuid(),
});

const deleteOverride = z.object({
  id: z.string().uuid(),
});

const getOverridesByProviderConfigId = z.object({
  providerConfigId: z.string().uuid(),
});

const getOverridesByGuardrailConfigId = z.object({
  guardrailConfigId: z.string().uuid(),
});

const getOverrideByProviderAndGuardrail = z.object({
  providerConfigId: z.string().uuid(),
  guardrailConfigId: z.string().uuid(),
});

export const createProviderGuardrailOverridesDataLayer = (
  db: Kysely<Database>
) => {
  return {
    createProviderGuardrailOverride: async (
      params: z.infer<typeof createProviderGuardrailOverride>
    ) => {
      const value =
        await createProviderGuardrailOverride.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerConfigId, guardrailConfigId, enabled, parameters } =
        value.data;

      return db
        .insertInto('provider_guardrail_overrides')
        .values({
          id: randomUUID(),
          providerConfigId,
          guardrailConfigId,
          enabled,
          parameters: parameters ? JSON.stringify(parameters) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    updateProviderGuardrailOverride: async (
      params: z.infer<typeof updateProviderGuardrailOverride>
    ) => {
      const value =
        await updateProviderGuardrailOverride.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id, enabled, parameters } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (enabled !== undefined) updateData.enabled = enabled;
      if (parameters !== undefined)
        updateData.parameters = parameters ? JSON.stringify(parameters) : null;

      return db
        .updateTable('provider_guardrail_overrides')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    getOverrideById: async (params: z.infer<typeof getOverrideById>) => {
      const value = await getOverrideById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .selectFrom('provider_guardrail_overrides')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    },

    deleteProviderGuardrailOverride: async (
      params: z.infer<typeof deleteOverride>
    ) => {
      const value = await deleteOverride.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .deleteFrom('provider_guardrail_overrides')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    getOverridesByProviderConfigId: async (
      params: z.infer<typeof getOverridesByProviderConfigId>
    ) => {
      const value =
        await getOverridesByProviderConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerConfigId } = value.data;

      return db
        .selectFrom('provider_guardrail_overrides')
        .selectAll()
        .where('providerConfigId', '=', providerConfigId)
        .execute();
    },

    getOverridesByGuardrailConfigId: async (
      params: z.infer<typeof getOverridesByGuardrailConfigId>
    ) => {
      const value =
        await getOverridesByGuardrailConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { guardrailConfigId } = value.data;

      return db
        .selectFrom('provider_guardrail_overrides')
        .selectAll()
        .where('guardrailConfigId', '=', guardrailConfigId)
        .execute();
    },

    getOverrideByProviderAndGuardrail: async (
      params: z.infer<typeof getOverrideByProviderAndGuardrail>
    ) => {
      const value =
        await getOverrideByProviderAndGuardrail.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerConfigId, guardrailConfigId } = value.data;

      return db
        .selectFrom('provider_guardrail_overrides')
        .selectAll()
        .where('providerConfigId', '=', providerConfigId)
        .where('guardrailConfigId', '=', guardrailConfigId)
        .executeTakeFirst();
    },

    /**
     * Upsert provider guardrail override - creates if not exists, updates if exists
     */
    upsertProviderGuardrailOverride: async (
      params: z.infer<typeof createProviderGuardrailOverride>
    ) => {
      const value =
        await createProviderGuardrailOverride.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { providerConfigId, guardrailConfigId, enabled, parameters } =
        value.data;

      // Check if override already exists
      const existing = await db
        .selectFrom('provider_guardrail_overrides')
        .selectAll()
        .where('providerConfigId', '=', providerConfigId)
        .where('guardrailConfigId', '=', guardrailConfigId)
        .executeTakeFirst();

      if (existing) {
        // Update existing override
        return db
          .updateTable('provider_guardrail_overrides')
          .set({
            enabled,
            parameters: parameters ? JSON.stringify(parameters) : null,
            updatedAt: new Date().toISOString(),
          })
          .where('id', '=', existing.id)
          .returningAll()
          .executeTakeFirst();
      }

      // Create new override
      return db
        .insertInto('provider_guardrail_overrides')
        .values({
          id: randomUUID(),
          providerConfigId,
          guardrailConfigId,
          enabled,
          parameters: parameters ? JSON.stringify(parameters) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Delete all overrides for a guardrail config
     * Useful when deleting a guardrail config
     */
    deleteOverridesByGuardrailConfigId: async (
      params: z.infer<typeof getOverridesByGuardrailConfigId>
    ) => {
      const value =
        await getOverridesByGuardrailConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { guardrailConfigId } = value.data;

      return db
        .deleteFrom('provider_guardrail_overrides')
        .where('guardrailConfigId', '=', guardrailConfigId)
        .execute();
    },
  };
};
