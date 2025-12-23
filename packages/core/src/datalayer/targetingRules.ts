import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
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

export const createTargetingRulesDataLayer = (db: Kysely<Database>) => {
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

      return db
        .insertInto('targeting_rules')
        .values({
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
        })
        .returningAll()
        .executeTakeFirst();
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

      return db
        .updateTable('targeting_rules')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    getTargetingRuleById: async (
      params: z.infer<typeof getTargetingRuleById>
    ) => {
      const value = await getTargetingRuleById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .selectFrom('targeting_rules')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
    },

    getTargetingRulesByConfigId: async (
      params: z.infer<typeof getTargetingRulesByConfigId>
    ) => {
      const value = await getTargetingRulesByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('targeting_rules')
        .selectAll()
        .where('configId', '=', configId)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
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

      return db
        .selectFrom('targeting_rules')
        .selectAll()
        .where('environmentId', '=', environmentId)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
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

      return db
        .selectFrom('targeting_rules')
        .selectAll()
        .where('configId', '=', configId)
        .where('environmentId', '=', environmentId)
        .where('enabled', '=', true)
        .orderBy('priority', 'desc')
        .orderBy('weight', 'desc')
        .execute();
    },

    deleteTargetingRule: async (
      params: z.infer<typeof deleteTargetingRule>
    ) => {
      const value = await deleteTargetingRule.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { id } = value.data;

      return db
        .deleteFrom('targeting_rules')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
    },

    deleteTargetingRulesByConfigId: async (
      params: z.infer<typeof deleteTargetingRulesByConfigId>
    ) => {
      const value = await deleteTargetingRulesByConfigId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { configId } = value.data;

      return db
        .deleteFrom('targeting_rules')
        .where('configId', '=', configId)
        .returningAll()
        .execute();
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

      return db
        .deleteFrom('targeting_rules')
        .where('environmentId', '=', environmentId)
        .returningAll()
        .execute();
    },

    listTargetingRules: async (params?: z.infer<typeof listTargetingRules>) => {
      const value = await listTargetingRules.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('targeting_rules')
        .selectAll()
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
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

      const rules = await db
        .selectFrom('targeting_rules')
        .leftJoin(
          'environments',
          'targeting_rules.environmentId',
          'environments.id'
        )
        .leftJoin(
          'config_variants',
          'targeting_rules.configVariantId',
          'config_variants.id'
        )
        .leftJoin('variants', 'config_variants.variantId', 'variants.id')
        .select([
          'targeting_rules.id',
          'targeting_rules.environmentId',
          'targeting_rules.configId',
          'targeting_rules.configVariantId',
          'targeting_rules.variantVersionId',
          'targeting_rules.weight',
          'targeting_rules.priority',
          'targeting_rules.enabled',
          'targeting_rules.conditions',
          'targeting_rules.createdAt',
          'targeting_rules.updatedAt',
          'environments.name as environmentName',
          'environments.slug as environmentSlug',
          'variants.name as variantName',
          'config_variants.variantId',
        ])
        .where('targeting_rules.configId', '=', configId)
        .orderBy('targeting_rules.priority', 'desc')
        .orderBy('targeting_rules.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      // For each rule, get the version info (either pinned version or latest)
      const rulesWithVersions = await Promise.all(
        rules.map(async (rule) => {
          let versionInfo = null;

          if (rule.variantVersionId) {
            // Get the specific pinned version
            versionInfo = await db
              .selectFrom('variant_versions')
              .select(['provider', 'modelName', 'version'])
              .where('id', '=', rule.variantVersionId)
              .executeTakeFirst();
          } else if (rule.variantId) {
            // Get the latest version
            versionInfo = await db
              .selectFrom('variant_versions')
              .select(['provider', 'modelName', 'version'])
              .where('variantId', '=', rule.variantId)
              .orderBy('version', 'desc')
              .limit(1)
              .executeTakeFirst();
          }

          return {
            ...rule,
            variantProvider: versionInfo?.provider ?? null,
            variantModelName: versionInfo?.modelName ?? null,
            pinnedVersion: rule.variantVersionId ? versionInfo?.version : null,
            latestVersion: !rule.variantVersionId ? versionInfo?.version : null,
          };
        })
      );

      return rulesWithVersions;
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
      await db
        .deleteFrom('targeting_rules')
        .where('configId', '=', configId)
        .where('environmentId', '=', environmentId)
        .execute();

      // Create new rule with 100% weight
      return db
        .insertInto('targeting_rules')
        .values({
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
        })
        .returningAll()
        .executeTakeFirst();
    },
  };
};
