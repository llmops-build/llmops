/**
 * Guardrail configuration in the manifest
 * Pre-loaded for gateway use without additional DB queries
 */
export interface ManifestGuardrail {
  id: string;
  name: string;
  pluginId: string;
  functionId: string;
  hookType: 'beforeRequestHook' | 'afterRequestHook';
  parameters: Record<string, unknown>;
  priority: number;
  onFail: 'block' | 'log';
}

/**
 * Provider-specific guardrail override in the manifest
 */
export interface ManifestProviderGuardrailOverride {
  id: string;
  providerConfigId: string;
  guardrailConfigId: string;
  enabled: boolean;
  parameters: Record<string, unknown> | null;
}

/**
 * The gateway manifest
 * Stored in cache under key: "gateway:manifest"
 */
export interface GatewayManifest {
  version: number;
  builtAt: string;

  // Guardrails pre-grouped by hook type for efficient gateway use
  guardrails: {
    beforeRequestHook: ManifestGuardrail[];
    afterRequestHook: ManifestGuardrail[];
  };

  // Provider-specific guardrail overrides keyed by providerConfigId
  providerGuardrailOverrides: Record<
    string,
    ManifestProviderGuardrailOverride[]
  >;
}
