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

export { createLLMRequestsDataLayer } from './llmRequests';
export type { LLMRequestInsert } from './llmRequests';
export { createWorkspaceSettingsDataLayer } from './workspaceSettings';
export { createProviderConfigsDataLayer } from './providerConfigs';

// Export adapter-based datalayer
export { createAdapterDataLayer } from './adapter-impl';
export type { AdapterDataLayer, LLMRequestInsert as AdapterLLMRequestInsert } from './adapter-impl';

/**
 * Create a Kysely-based datalayer (default for SQL databases)
 *
 * This is the recommended datalayer for SQL databases (PostgreSQL, MySQL, SQLite).
 * For non-SQL databases or custom adapters, use `createAdapterDataLayer` instead.
 */
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
  };
};
