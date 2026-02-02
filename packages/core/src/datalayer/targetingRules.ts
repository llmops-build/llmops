import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type {
  ConfigVariant,
  Environment,
  TargetingRule,
  Variant,
  VariantVersion,
} from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createTargetingRule = z.object({
  environmentId: z.string().uuid(),
  configId: z.string().uuid(),
  configVariantId: z.string().uuid(),
  variantVersionId: z.string().uuid().nullable().optional(), // null means use latest version
  weight: z.number().int().min(0).max(10000).optional().default(10000),
  priority: z.number().int().optional().default(0),
  enabled: z.boolean().optional().default(true),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
});

const updateTargetingRule = z.object({
  id: z.string().uuid(),
  variantVersionId: z.string().uuid().nullable().optional(),
  weight: z.number().int().min(0).max(10000).optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
});

const getTargetingRuleById = z.object({
  id: z.string().uuid(),
});

const getTargetingRulesByConfigId = z.object({
  configId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const getTargetingRulesByEnvironmentId = z.object({
  environmentId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const getTargetingRulesByConfigAndEnvironment = z.object({
  configId: z.string().uuid(),
  environmentId: z.string().uuid(),
});

const deleteTargetingRule = z.object({
  id: z.string().uuid(),
});

const deleteTargetingRulesByConfigId = z.object({
  configId: z.string().uuid(),
});

const deleteTargetingRulesByEnvironmentId = z.object({
  environmentId: z.string().uuid(),
});

const listTargetingRules = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const setTargetingForEnvironment = z.object({
  environmentId: z.string().uuid(),
  configId: z.string().uuid(),
  configVariantId: z.string().uuid(),
  variantVersionId: z.string().uuid().nullable().optional(),
});

export const createTargetingRulesDataLayer = (adapter: Adapter) => {
  return {
    createTargetingRule: async (
      params: z.infer<typeof createTargetingRule>
    ) => {
      const value = await createTargetingRule.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const {
        environmentId,
        configId,
        configVariantId,
        variantVersionId,
        weight,
        priority,
        enabled,
        conditions,
      } = value.data;

      return adapter.create<TargetingRule>('targeting_rules', {
        id: randomUUID(),
        environmentId,
        configId,
        configVariantId,
        variantVersionId: variantVersionId ?? null,
        weight,
        priority,
        enabled,
        conditions: JSON.stringify(conditions ?? {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    updateTargetingRule: async (
      params: z.infer<typeof updateTargetingRule>
    ) => {
      const value = await updateTargetingRule.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id, variantVersionId, weight, priority, enabled, conditions } =
        value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (variantVersionId !== undefined)
        updateData.variantVersionId = variantVersionId;
      if (weight !== undefined) updateData.weight = weight;
      if (priority !== undefined) updateData.priority = priority;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (conditions !== undefined) {
        updateData.conditions = conditions ? JSON.stringify(conditions) : null;
      }

      return adapter.update<TargetingRule>(
        'targeting_rules',
        [{ field: 'id', value: id }],
        updateData
      );
    },

    getTargetingRuleById: async (
      params: z.infer<typeof getTargetingRuleById>
    ) => {
      const value = await getTargetingRuleById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.findOne<TargetingRule>('targeting_rules', [
        { field: 'id', value: id },
      ]);
    },

    getTargetingRulesByConfigId: async (
      params: z.infer<typeof getTargetingRulesByConfigId>
    ) => {
      const value = await getTargetingRulesByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<TargetingRule>('targeting_rules', {
        where: [
          { field: 'configId', value: configId },
          { field: 'enabled', value: true },
        ],
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        limit,
        offset,
      });
    },

    getTargetingRulesByEnvironmentId: async (
      params: z.infer<typeof getTargetingRulesByEnvironmentId>
    ) => {
      const value =
        await getTargetingRulesByEnvironmentId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<TargetingRule>('targeting_rules', {
        where: [
          { field: 'environmentId', value: environmentId },
          { field: 'enabled', value: true },
        ],
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        limit,
        offset,
      });
    },

    getTargetingRulesByConfigAndEnvironment: async (
      params: z.infer<typeof getTargetingRulesByConfigAndEnvironment>
    ) => {
      const value =
        await getTargetingRulesByConfigAndEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, environmentId } = value.data;

      return adapter.findMany<TargetingRule>('targeting_rules', {
        where: [
          { field: 'configId', value: configId },
          { field: 'environmentId', value: environmentId },
          { field: 'enabled', value: true },
        ],
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'weight', direction: 'desc' },
        ],
      });
    },

    deleteTargetingRule: async (
      params: z.infer<typeof deleteTargetingRule>
    ) => {
      const value = await deleteTargetingRule.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return adapter.delete<TargetingRule>('targeting_rules', [
        { field: 'id', value: id },
      ]);
    },

    deleteTargetingRulesByConfigId: async (
      params: z.infer<typeof deleteTargetingRulesByConfigId>
    ) => {
      const value = await deleteTargetingRulesByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      // Get all rules first to return them
      const rules = await adapter.findMany<TargetingRule>('targeting_rules', {
        where: [{ field: 'configId', value: configId }],
      });

      // Delete all rules
      await adapter.deleteMany('targeting_rules', [
        { field: 'configId', value: configId },
      ]);

      return rules;
    },

    deleteTargetingRulesByEnvironmentId: async (
      params: z.infer<typeof deleteTargetingRulesByEnvironmentId>
    ) => {
      const value =
        await deleteTargetingRulesByEnvironmentId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      // Get all rules first to return them
      const rules = await adapter.findMany<TargetingRule>('targeting_rules', {
        where: [{ field: 'environmentId', value: environmentId }],
      });

      // Delete all rules
      await adapter.deleteMany('targeting_rules', [
        { field: 'environmentId', value: environmentId },
      ]);

      return rules;
    },

    listTargetingRules: async (params?: z.infer<typeof listTargetingRules>) => {
      const value = await listTargetingRules.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<TargetingRule>('targeting_rules', {
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        limit,
        offset,
      });
    },

    /**
     * Get targeting rules with full details (environment, config, variant info)
     * Now includes variantVersionId and resolves the actual version being used
     */
    getTargetingRulesWithDetailsByConfigId: async (
      params: z.infer<typeof getTargetingRulesByConfigId>
    ) => {
      const value = await getTargetingRulesByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      const rules = await adapter.findMany<TargetingRule>('targeting_rules', {
        where: [{ field: 'configId', value: configId }],
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'desc' },
        ],
        limit,
        offset,
      });

      // For each rule, get the related details
      const rulesWithDetails = await Promise.all(
        rules.map(async (rule) => {
          // Get environment, config variant, and variant info
          const [environment, configVariant] = await Promise.all([
            adapter.findOne<Environment>('environments', [
              { field: 'id', value: rule.environmentId },
            ]),
            adapter.findOne<ConfigVariant>('config_variants', [
              { field: 'id', value: rule.configVariantId },
            ]),
          ]);

          let variant: Variant | null = null;
          if (configVariant) {
            variant = await adapter.findOne<Variant>('variants', [
              { field: 'id', value: configVariant.variantId },
            ]);
          }

          let versionInfo: VariantVersion | null = null;

          if (rule.variantVersionId) {
            // Get the specific pinned version
            versionInfo = await adapter.findOne<VariantVersion>(
              'variant_versions',
              [{ field: 'id', value: rule.variantVersionId }]
            );
          } else if (configVariant) {
            // Get the latest version
            const versions = await adapter.findMany<VariantVersion>(
              'variant_versions',
              {
                where: [{ field: 'variantId', value: configVariant.variantId }],
                orderBy: [{ field: 'version', direction: 'desc' }],
                limit: 1,
              }
            );
            versionInfo = versions[0] ?? null;
          }

          return {
            ...rule,
            variantId: configVariant?.variantId ?? null,
            environmentName: environment?.name ?? null,
            environmentSlug: environment?.slug ?? null,
            variantName: variant?.name ?? null,
            variantProvider: versionInfo?.provider ?? null,
            variantModelName: versionInfo?.modelName ?? null,
            pinnedVersion: rule.variantVersionId ? versionInfo?.version : null,
            latestVersion: !rule.variantVersionId ? versionInfo?.version : null,
          };
        })
      );

      return rulesWithDetails;
    },

    /**
     * Set a single variant for an environment (replaces existing).
     * Now supports optional variantVersionId to pin to a specific version.
     */
    setTargetingForEnvironment: async (
      params: z.infer<typeof setTargetingForEnvironment>
    ) => {
      const value = await setTargetingForEnvironment.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId, configId, configVariantId, variantVersionId } =
        value.data;

      const now = new Date().toISOString();

      // Delete existing rules for this config+environment
      await adapter.deleteMany('targeting_rules', [
        { field: 'configId', value: configId },
        { field: 'environmentId', value: environmentId },
      ]);

      // Create new rule with 100% weight
      return adapter.create<TargetingRule>('targeting_rules', {
        id: randomUUID(),
        environmentId,
        configId,
        configVariantId,
        variantVersionId: variantVersionId ?? null,
        weight: 10000,
        priority: 0,
        enabled: true,
        conditions: JSON.stringify({}),
        createdAt: now,
        updatedAt: now,
      });
    },
  };
};
