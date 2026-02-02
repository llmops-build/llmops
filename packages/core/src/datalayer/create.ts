import type { Adapter } from '../adapter/types';
import type { DataLayer, LLMRequestsDataLayer } from './interface';

import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createDatasetsDataLayer } from './datasets';
import { createEnvironmentDataLayer } from './environments';
import { createEnvironmentSecretDataLayer } from './environmentSecrets';
import { createGuardrailConfigsDataLayer } from './guardrailConfigs';
import { createPlaygroundDataLayer } from './playgrounds';
import { createPlaygroundResultsDataLayer } from './playgroundResults';
import { createPlaygroundRunsDataLayer } from './playgroundRuns';
import { createProviderConfigsDataLayer } from './providerConfigs';
import { createProviderGuardrailOverridesDataLayer } from './providerGuardrailOverrides';
import { createTargetingRulesDataLayer } from './targetingRules';
import { createVariantDataLayer } from './variants';
import { createVariantVersionsDataLayer } from './variantVersions';
import { createWorkspaceSettingsDataLayer } from './workspaceSettings';

/**
 * Create all datalayers from an Adapter instance.
 * Returns a flat object with all datalayer methods spread together.
 *
 * Note: LLM Requests datalayer requires Kysely directly due to complex
 * PostgreSQL-specific analytics queries. Use createLLMRequestsDataLayer
 * separately if you need analytics functionality with a SQL database.
 */
export function createDataLayer(adapter: Adapter): Omit<DataLayer, keyof LLMRequestsDataLayer> {
  return {
    ...createConfigDataLayer(adapter),
    ...createConfigVariantDataLayer(adapter),
    ...createDatasetsDataLayer(adapter),
    ...createEnvironmentDataLayer(adapter),
    ...createEnvironmentSecretDataLayer(adapter),
    ...createGuardrailConfigsDataLayer(adapter),
    ...createPlaygroundDataLayer(adapter),
    ...createPlaygroundResultsDataLayer(adapter),
    ...createPlaygroundRunsDataLayer(adapter),
    ...createProviderConfigsDataLayer(adapter),
    ...createProviderGuardrailOverridesDataLayer(adapter),
    ...createTargetingRulesDataLayer(adapter),
    ...createVariantDataLayer(adapter),
    ...createVariantVersionsDataLayer(adapter),
    ...createWorkspaceSettingsDataLayer(adapter),
  };
}

// Re-export for convenience when using with Kysely
export { createLLMRequestsDataLayer } from './llmRequests';
