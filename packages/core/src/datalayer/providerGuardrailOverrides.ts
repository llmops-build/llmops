import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { ProviderGuardrailOverride } from '@/schemas';
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

export const createProviderGuardrailOverridesDataLayer = (adapter: Adapter) => {
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

      return adapter.create<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        {
          id: randomUUID(),
          providerConfigId,
          guardrailConfigId,
          enabled,
          parameters: parameters ? JSON.stringify(parameters) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
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

      return adapter.update<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        [{ field: 'id', value: id }],
        updateData
      );
    },

    getOverrideById: async (params: z.infer<typeof getOverrideById>) => {
      const value = await getOverrideById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.findOne<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        [{ field: 'id', value: id }]
      );
    },

    deleteProviderGuardrailOverride: async (
      params: z.infer<typeof deleteOverride>
    ) => {
      const value = await deleteOverride.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.delete<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        [{ field: 'id', value: id }]
      );
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

      return adapter.findMany<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        {
          where: [{ field: 'providerConfigId', value: providerConfigId }],
        }
      );
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

      return adapter.findMany<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        {
          where: [{ field: 'guardrailConfigId', value: guardrailConfigId }],
        }
      );
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

      return adapter.findOne<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        [
          { field: 'providerConfigId', value: providerConfigId },
          { field: 'guardrailConfigId', value: guardrailConfigId },
        ]
      );
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
      const existing = await adapter.findOne<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        [
          { field: 'providerConfigId', value: providerConfigId },
          { field: 'guardrailConfigId', value: guardrailConfigId },
        ]
      );

      if (existing) {
        // Update existing override
        return adapter.update<ProviderGuardrailOverride>(
          'provider_guardrail_overrides',
          [{ field: 'id', value: existing.id }],
          {
            enabled,
            parameters: parameters ? JSON.stringify(parameters) : null,
            updatedAt: new Date().toISOString(),
          }
        );
      }

      // Create new override
      return adapter.create<ProviderGuardrailOverride>(
        'provider_guardrail_overrides',
        {
          id: randomUUID(),
          providerConfigId,
          guardrailConfigId,
          enabled,
          parameters: parameters ? JSON.stringify(parameters) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
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

      return adapter.deleteMany('provider_guardrail_overrides', [
        { field: 'guardrailConfigId', value: guardrailConfigId },
      ]);
    },
  };
};
