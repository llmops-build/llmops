import jsonLogic from 'json-logic-js';
import type {
  GatewayManifest,
  ManifestTargetingRule,
  RoutingContext,
  RoutingResult,
} from './types';

/**
 * Router for evaluating the gateway manifest and selecting variants
 */
export class ManifestRouter {
  constructor(private manifest: GatewayManifest) {}

  /**
   * Resolve a config identifier (UUID or slug) to config ID
   */
  resolveConfigId(configIdOrSlug: string): string | null {
    // Check if it's already a valid config ID
    if (this.manifest.configs[configIdOrSlug]) {
      return configIdOrSlug;
    }
    // Try slug lookup
    return this.manifest.configsBySlug[configIdOrSlug] ?? null;
  }

  /**
   * Resolve environment from secret value
   */
  resolveEnvironmentFromSecret(secretValue: string): string | null {
    return this.manifest.secretToEnvironment[secretValue] ?? null;
  }

  /**
   * Get production environment ID
   */
  getProductionEnvironmentId(): string | null {
    for (const env of Object.values(this.manifest.environments)) {
      if (env.isProd) return env.id;
    }
    return null;
  }

  /**
   * Get environment by ID
   */
  getEnvironment(environmentId: string) {
    return this.manifest.environments[environmentId] ?? null;
  }

  /**
   * Get config by ID
   */
  getConfig(configId: string) {
    return this.manifest.configs[configId] ?? null;
  }

  /**
   * Route a request to the appropriate variant version (first match wins)
   */
  route(
    configIdOrSlug: string,
    environmentId: string,
    context: RoutingContext = {}
  ): RoutingResult | null {
    // Resolve config ID
    const configId = this.resolveConfigId(configIdOrSlug);
    if (!configId) return null;

    // Get rules for this config + environment
    const rules = this.manifest.routingTable[configId]?.[environmentId];
    if (!rules || rules.length === 0) return null;

    // Prepare context with defaults
    const evalContext: RoutingContext = {
      ...context,
      timestamp: context.timestamp ?? Date.now(),
    };

    // Evaluate rules in priority order
    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Check JSONLogic conditions if present
      if (rule.conditions) {
        try {
          const matches = jsonLogic.apply(rule.conditions, evalContext);
          if (!matches) continue;
        } catch (error) {
          // On evaluation error, skip this rule
          console.warn(
            `JSONLogic evaluation error for rule ${rule.id}:`,
            error
          );
          continue;
        }
      }

      // Rule matches! First matching rule wins
      return {
        configId,
        environmentId,
        variantId: rule.resolvedVersion.variantId,
        version: rule.resolvedVersion,
        rule,
      };
    }

    return null;
  }

  /**
   * Route with weighted random selection among matching rules of same priority
   */
  routeWithWeights(
    configIdOrSlug: string,
    environmentId: string,
    context: RoutingContext = {}
  ): RoutingResult | null {
    const configId = this.resolveConfigId(configIdOrSlug);
    if (!configId) return null;

    const rules = this.manifest.routingTable[configId]?.[environmentId];
    if (!rules || rules.length === 0) return null;

    const evalContext: RoutingContext = {
      ...context,
      timestamp: context.timestamp ?? Date.now(),
    };

    // Group rules by priority
    const rulesByPriority = new Map<number, ManifestTargetingRule[]>();
    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Check conditions
      if (rule.conditions) {
        try {
          if (!jsonLogic.apply(rule.conditions, evalContext)) continue;
        } catch {
          continue;
        }
      }

      const list = rulesByPriority.get(rule.priority) || [];
      list.push(rule);
      rulesByPriority.set(rule.priority, list);
    }

    // Get highest priority group
    const priorities = Array.from(rulesByPriority.keys()).sort((a, b) => b - a);
    if (priorities.length === 0) return null;

    const topPriorityRules = rulesByPriority.get(priorities[0])!;

    // If only one rule at top priority, return it directly
    if (topPriorityRules.length === 1) {
      const rule = topPriorityRules[0];
      return {
        configId,
        environmentId,
        variantId: rule.resolvedVersion.variantId,
        version: rule.resolvedVersion,
        rule,
      };
    }

    // Weighted random selection
    const totalWeight = topPriorityRules.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return null;

    let random = Math.random() * totalWeight;
    for (const rule of topPriorityRules) {
      random -= rule.weight;
      if (random <= 0) {
        return {
          configId,
          environmentId,
          variantId: rule.resolvedVersion.variantId,
          version: rule.resolvedVersion,
          rule,
        };
      }
    }

    // Fallback to first rule (shouldn't happen, but just in case)
    const rule = topPriorityRules[0];
    return {
      configId,
      environmentId,
      variantId: rule.resolvedVersion.variantId,
      version: rule.resolvedVersion,
      rule,
    };
  }
}
