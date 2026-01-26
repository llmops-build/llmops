import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createEnvironmentDataLayer } from './environments';
import { createEnvironmentSecretDataLayer } from './environmentSecrets';
import { createGuardrailConfigsDataLayer } from './guardrailConfigs';
import { createLLMRequestsDataLayer } from './llmRequests';
import { createPlaygroundDataLayer } from './playgrounds';
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

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    ...createConfigDataLayer(db),
    ...createConfigVariantDataLayer(db),
    ...createEnvironmentDataLayer(db),
    ...createEnvironmentSecretDataLayer(db),
    ...createGuardrailConfigsDataLayer(db),
    ...createLLMRequestsDataLayer(db),
    ...createPlaygroundDataLayer(db),
    ...createProviderConfigsDataLayer(db),
    ...createProviderGuardrailOverridesDataLayer(db),
    ...createTargetingRulesDataLayer(db),
    ...createVariantDataLayer(db),
    ...createVariantVersionsDataLayer(db),
    ...createWorkspaceSettingsDataLayer(db),
  };
};
