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
import { createTracesDataLayer } from './traces';
import { createVariantDataLayer } from './variants';
import { createVariantVersionsDataLayer } from './variantVersions';
import { createWorkspaceSettingsDataLayer } from './workspaceSettings';

/**
 * Create all datalayers from a Kysely database instance.
 * Returns a flat object with all datalayer methods spread together.
 */
export function createDataLayer(db: Kysely<Database>): DataLayer {
  return {
    ...createConfigDataLayer(db),
    ...createConfigVariantDataLayer(db),
    ...createDatasetsDataLayer(db),
    ...createEnvironmentDataLayer(db),
    ...createEnvironmentSecretDataLayer(db),
    ...createGuardrailConfigsDataLayer(db),
    ...createLLMRequestsDataLayer(db),
    ...createPlaygroundDataLayer(db),
    ...createPlaygroundResultsDataLayer(db),
    ...createPlaygroundRunsDataLayer(db),
    ...createProviderConfigsDataLayer(db),
    ...createProviderGuardrailOverridesDataLayer(db),
    ...createTargetingRulesDataLayer(db),
    ...createTracesDataLayer(db),
    ...createVariantDataLayer(db),
    ...createVariantVersionsDataLayer(db),
    ...createWorkspaceSettingsDataLayer(db),
  };
}
