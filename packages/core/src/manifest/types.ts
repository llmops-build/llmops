import type { RulesLogic } from 'json-logic-js';

/**
 * Pre-computed variant version data needed for routing
 */
export interface ManifestVariantVersion {
  id: string;
  variantId: string;
  version: number;
  provider: string;
  providerConfigId: string | null;
  modelName: string;
  jsonData: Record<string, unknown>;
}

/**
 * A targeting rule entry in the manifest
 * Pre-resolved with all necessary data for routing
 */
export interface ManifestTargetingRule {
  id: string;
  configVariantId: string;
  variantVersionId: string | null;
  weight: number;
  priority: number;
  enabled: boolean;
  conditions: RulesLogic | null;
  resolvedVersion: ManifestVariantVersion;
}

/**
 * Config entry in the manifest
 */
export interface ManifestConfig {
  id: string;
  slug: string;
  name: string | null;
}

/**
 * Environment entry in the manifest
 */
export interface ManifestEnvironment {
  id: string;
  slug: string;
  name: string;
  isProd: boolean;
}

/**
 * The complete routing manifest
 * Stored in cache under key: "gateway:manifest"
 */
export interface GatewayManifest {
  version: number;
  builtAt: string;

  // Lookup tables for fast access
  configs: Record<string, ManifestConfig>;
  configsBySlug: Record<string, string>;
  environments: Record<string, ManifestEnvironment>;
  environmentsBySlug: Record<string, string>;

  // The main routing table: configId -> environmentId -> targeting rules (sorted by priority desc)
  routingTable: Record<string, Record<string, ManifestTargetingRule[]>>;

  // Environment secret lookup: secretValue -> environmentId
  secretToEnvironment: Record<string, string>;
}

/**
 * Context passed to JSONLogic for condition evaluation
 */
export interface RoutingContext {
  headers?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    groups?: string[];
    [key: string]: unknown;
  };
  request?: {
    path?: string;
    method?: string;
    ip?: string;
  };
  custom?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Result of routing a request
 */
export interface RoutingResult {
  configId: string;
  environmentId: string;
  variantId: string;
  version: ManifestVariantVersion;
  rule: ManifestTargetingRule;
}
