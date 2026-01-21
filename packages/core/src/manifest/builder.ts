import type { Kysely } from 'kysely';
import type { RulesLogic } from 'json-logic-js';
import type { Database } from '../db/schema';
import type {
  GatewayManifest,
  ManifestConfig,
  ManifestEnvironment,
  ManifestTargetingRule,
  ManifestVariantVersion,
} from './types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Builds the gateway routing manifest from database
 */
export class ManifestBuilder {
  constructor(private db: Kysely<Database>) {}

  /**
   * Build the complete routing manifest from database
   */
  async build(): Promise<GatewayManifest> {
    // Parallel fetch of all required data
    const [
      configs,
      environments,
      environmentSecrets,
      targetingRules,
      configVariants,
      variantVersions,
      providerConfigs,
    ] = await Promise.all([
      this.db.selectFrom('configs').selectAll().execute(),
      this.db.selectFrom('environments').selectAll().execute(),
      this.db.selectFrom('environment_secrets').selectAll().execute(),
      this.db
        .selectFrom('targeting_rules')
        .where('enabled', '=', true)
        .selectAll()
        .execute(),
      this.db.selectFrom('config_variants').selectAll().execute(),
      this.db.selectFrom('variant_versions').selectAll().execute(),
      this.db.selectFrom('provider_configs').selectAll().execute(),
    ]);

    // Build config lookup tables
    const manifestConfigs: Record<string, ManifestConfig> = {};
    const configsBySlug: Record<string, string> = {};

    for (const config of configs) {
      manifestConfigs[config.id] = {
        id: config.id,
        slug: config.slug,
        name: config.name ?? null,
      };
      configsBySlug[config.slug] = config.id;
    }

    // Build environment lookup tables
    const manifestEnvironments: Record<string, ManifestEnvironment> = {};
    const environmentsBySlug: Record<string, string> = {};

    for (const env of environments) {
      manifestEnvironments[env.id] = {
        id: env.id,
        slug: env.slug,
        name: env.name,
        isProd: env.isProd,
      };
      environmentsBySlug[env.slug] = env.id;
    }

    // Build secret to environment lookup
    const secretToEnvironment: Record<string, string> = {};
    for (const secret of environmentSecrets) {
      secretToEnvironment[secret.keyValue] = secret.environmentId;
    }

    // Build helper maps
    const configVariantMap = new Map(configVariants.map((cv) => [cv.id, cv]));
    const providerConfigMap = new Map(providerConfigs.map((pc) => [pc.id, pc]));

    // Build versions by variant (sorted by version desc for "latest" lookup)
    const versionsByVariant = new Map<string, typeof variantVersions>();
    for (const vv of variantVersions) {
      const list = versionsByVariant.get(vv.variantId) || [];
      list.push(vv);
      versionsByVariant.set(vv.variantId, list);
    }
    for (const list of versionsByVariant.values()) {
      list.sort((a, b) => b.version - a.version);
    }

    // Build version by ID map for pinned version lookup
    const versionById = new Map(variantVersions.map((vv) => [vv.id, vv]));

    // Helper to resolve provider from providerConfigId or raw provider string
    const resolveProvider = (
      provider: string
    ): { providerId: string; providerConfigId: string | null } => {
      if (UUID_REGEX.test(provider)) {
        const pc = providerConfigMap.get(provider);
        if (pc) {
          return { providerId: pc.providerId, providerConfigId: pc.id };
        }
      }
      return { providerId: provider, providerConfigId: null };
    };

    // Helper to build ManifestVariantVersion
    const buildVersion = (
      vv: (typeof variantVersions)[0]
    ): ManifestVariantVersion => {
      const { providerId, providerConfigId } = resolveProvider(vv.provider);
      const jsonData =
        typeof vv.jsonData === 'string'
          ? JSON.parse(vv.jsonData)
          : vv.jsonData;

      return {
        id: vv.id,
        variantId: vv.variantId,
        version: vv.version,
        provider: providerId,
        providerConfigId,
        modelName: vv.modelName,
        jsonData,
      };
    };

    // Build routing table
    const routingTable: Record<
      string,
      Record<string, ManifestTargetingRule[]>
    > = {};

    for (const rule of targetingRules) {
      const configVariant = configVariantMap.get(rule.configVariantId);
      if (!configVariant) continue;

      const variantId = configVariant.variantId;

      // Resolve version: pinned or latest
      let resolvedVersionData: (typeof variantVersions)[0] | undefined;
      if (rule.variantVersionId) {
        resolvedVersionData = versionById.get(rule.variantVersionId);
      } else {
        const versions = versionsByVariant.get(variantId);
        resolvedVersionData = versions?.[0]; // Latest (already sorted desc)
      }

      if (!resolvedVersionData) continue;

      // Parse conditions
      let conditions: RulesLogic | null = null;
      if (rule.conditions) {
        const conditionsObj =
          typeof rule.conditions === 'string'
            ? JSON.parse(rule.conditions)
            : rule.conditions;
        if (conditionsObj && Object.keys(conditionsObj).length > 0) {
          conditions = conditionsObj as RulesLogic;
        }
      }

      const manifestRule: ManifestTargetingRule = {
        id: rule.id,
        configVariantId: rule.configVariantId,
        variantVersionId: rule.variantVersionId,
        weight: rule.weight,
        priority: rule.priority,
        enabled: rule.enabled,
        conditions,
        resolvedVersion: buildVersion(resolvedVersionData),
      };

      // Add to routing table
      if (!routingTable[rule.configId]) {
        routingTable[rule.configId] = {};
      }
      if (!routingTable[rule.configId][rule.environmentId]) {
        routingTable[rule.configId][rule.environmentId] = [];
      }
      routingTable[rule.configId][rule.environmentId].push(manifestRule);
    }

    // Sort each environment's rules by priority (desc), then by weight (desc)
    for (const configRules of Object.values(routingTable)) {
      for (const envRules of Object.values(configRules)) {
        envRules.sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return b.weight - a.weight;
        });
      }
    }

    return {
      version: Date.now(),
      builtAt: new Date().toISOString(),
      configs: manifestConfigs,
      configsBySlug,
      environments: manifestEnvironments,
      environmentsBySlug,
      routingTable,
      secretToEnvironment,
    };
  }
}
