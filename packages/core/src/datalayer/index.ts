import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createEnvironmentDataLayer } from './environments';
import { createEnvironmentSecretDataLayer } from './environmentSecrets';
import { createLLMRequestsDataLayer } from './llmRequests';
import { createProviderConfigsDataLayer } from './providerConfigs';
import { createTargetingRulesDataLayer } from './targetingRules';
import { createVariantDataLayer } from './variants';
import { createVariantVersionsDataLayer } from './variantVersions';
import { createWorkspaceSettingsDataLayer } from './workspaceSettings';
import { createPlaygroundDataLayer } from './playgrounds';

export { createLLMRequestsDataLayer } from './llmRequests';
export type { LLMRequestInsert } from './llmRequests';
export { createWorkspaceSettingsDataLayer } from './workspaceSettings';
export { createProviderConfigsDataLayer } from './providerConfigs';

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    ...createConfigDataLayer(db),
    ...createConfigVariantDataLayer(db),
    ...createEnvironmentDataLayer(db),
    ...createEnvironmentSecretDataLayer(db),
    ...createLLMRequestsDataLayer(db),
    ...createProviderConfigsDataLayer(db),
    ...createTargetingRulesDataLayer(db),
    ...createVariantDataLayer(db),
    ...createVariantVersionsDataLayer(db),
    ...createWorkspaceSettingsDataLayer(db),
    ...createPlaygroundDataLayer(db),
  };
};
