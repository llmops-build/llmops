import type { createConfigDataLayer } from './configs';
import type { createConfigVariantDataLayer } from './configVariants';
import type { createDatasetsDataLayer } from './datasets';
import type { createEnvironmentDataLayer } from './environments';
import type { createEnvironmentSecretDataLayer } from './environmentSecrets';
import type { createGuardrailConfigsDataLayer } from './guardrailConfigs';
import type { createLLMRequestsDataLayer } from './llmRequests';
import type { createPlaygroundDataLayer } from './playgrounds';
import type { createPlaygroundResultsDataLayer } from './playgroundResults';
import type { createPlaygroundRunsDataLayer } from './playgroundRuns';
import type { createProviderConfigsDataLayer } from './providerConfigs';
import type { createProviderGuardrailOverridesDataLayer } from './providerGuardrailOverrides';
import type { createTargetingRulesDataLayer } from './targetingRules';
import type { createVariantDataLayer } from './variants';
import type { createVariantVersionsDataLayer } from './variantVersions';
import type { createTracesDataLayer } from './traces';
import type { createWorkspaceSettingsDataLayer } from './workspaceSettings';

// Infer types from existing implementations
export type ConfigsDataLayer = ReturnType<typeof createConfigDataLayer>;
export type ConfigVariantsDataLayer = ReturnType<typeof createConfigVariantDataLayer>;
export type DatasetsDataLayer = ReturnType<typeof createDatasetsDataLayer>;
export type EnvironmentsDataLayer = ReturnType<typeof createEnvironmentDataLayer>;
export type EnvironmentSecretsDataLayer = ReturnType<
  typeof createEnvironmentSecretDataLayer
>;
export type GuardrailConfigsDataLayer = ReturnType<
  typeof createGuardrailConfigsDataLayer
>;
export type LLMRequestsDataLayer = ReturnType<typeof createLLMRequestsDataLayer>;
export type PlaygroundsDataLayer = ReturnType<typeof createPlaygroundDataLayer>;
export type PlaygroundResultsDataLayer = ReturnType<
  typeof createPlaygroundResultsDataLayer
>;
export type PlaygroundRunsDataLayer = ReturnType<
  typeof createPlaygroundRunsDataLayer
>;
export type ProviderConfigsDataLayer = ReturnType<
  typeof createProviderConfigsDataLayer
>;
export type ProviderGuardrailOverridesDataLayer = ReturnType<
  typeof createProviderGuardrailOverridesDataLayer
>;
export type TargetingRulesDataLayer = ReturnType<
  typeof createTargetingRulesDataLayer
>;
export type VariantsDataLayer = ReturnType<typeof createVariantDataLayer>;
export type VariantVersionsDataLayer = ReturnType<
  typeof createVariantVersionsDataLayer
>;
export type TracesDataLayer = ReturnType<typeof createTracesDataLayer>;
export type WorkspaceSettingsDataLayer = ReturnType<
  typeof createWorkspaceSettingsDataLayer
>;

// Combined flat interface (all methods spread together)
export type DataLayer = ConfigsDataLayer &
  ConfigVariantsDataLayer &
  DatasetsDataLayer &
  EnvironmentsDataLayer &
  EnvironmentSecretsDataLayer &
  GuardrailConfigsDataLayer &
  LLMRequestsDataLayer &
  PlaygroundsDataLayer &
  PlaygroundResultsDataLayer &
  PlaygroundRunsDataLayer &
  ProviderConfigsDataLayer &
  ProviderGuardrailOverridesDataLayer &
  TargetingRulesDataLayer &
  TracesDataLayer &
  VariantsDataLayer &
  VariantVersionsDataLayer &
  WorkspaceSettingsDataLayer;
