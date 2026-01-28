import type { Kysely } from 'kysely';
import type { Database } from '../db';
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

export { createLLMRequestsDataLayer } from './llmRequests';
export type { LLMRequestInsert } from './llmRequests';
export { createWorkspaceSettingsDataLayer } from './workspaceSettings';
export { createProviderConfigsDataLayer } from './providerConfigs';
export { createGuardrailConfigsDataLayer } from './guardrailConfigs';
export { createProviderGuardrailOverridesDataLayer } from './providerGuardrailOverrides';
export { createDatasetsDataLayer } from './datasets';
export { createPlaygroundRunsDataLayer } from './playgroundRuns';
export { createPlaygroundResultsDataLayer } from './playgroundResults';

export const createDataLayer = async (db: Kysely<Database>) => {
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
    ...createVariantDataLayer(db),
    ...createVariantVersionsDataLayer(db),
    ...createWorkspaceSettingsDataLayer(db),
  };
};
