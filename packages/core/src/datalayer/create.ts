import type { Kysely } from 'kysely';
import type { Database } from '../schemas';
import type { DataLayer } from './interface';

import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createDatasetsDataLayer } from './datasets';
import { createEnvironmentDataLayer } from './environments';
import { createEnvironmentSecretDataLayer } from './environmentSecrets';
import { createGuardrailConfigsDataLayer } from './guardrailConfigs';
import { createLLMRequestsDataLayer } from './llmRequests';
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
 * Create all datalayers from a Kysely database instance.
 */
export function createDataLayer(db: Kysely<Database>): DataLayer {
  return {
    configs: createConfigDataLayer(db),
    configVariants: createConfigVariantDataLayer(db),
    datasets: createDatasetsDataLayer(db),
    environments: createEnvironmentDataLayer(db),
    environmentSecrets: createEnvironmentSecretDataLayer(db),
    guardrailConfigs: createGuardrailConfigsDataLayer(db),
    llmRequests: createLLMRequestsDataLayer(db),
    playgrounds: createPlaygroundDataLayer(db),
    playgroundResults: createPlaygroundResultsDataLayer(db),
    playgroundRuns: createPlaygroundRunsDataLayer(db),
    providerConfigs: createProviderConfigsDataLayer(db),
    providerGuardrailOverrides: createProviderGuardrailOverridesDataLayer(db),
    targetingRules: createTargetingRulesDataLayer(db),
    variants: createVariantDataLayer(db),
    variantVersions: createVariantVersionsDataLayer(db),
    workspaceSettings: createWorkspaceSettingsDataLayer(db),
  };
}
