import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createEnvironmentDataLayer } from './environments';
import { createEnvironmentSecretDataLayer } from './environmentSecrets';
import { createTargetingRulesDataLayer } from './targetingRules';
import { createVariantDataLayer } from './variants';
import { createVariantVersionsDataLayer } from './variantVersions';

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    ...createConfigDataLayer(db),
    ...createConfigVariantDataLayer(db),
    ...createEnvironmentDataLayer(db),
    ...createEnvironmentSecretDataLayer(db),
    ...createTargetingRulesDataLayer(db),
    ...createVariantDataLayer(db),
    ...createVariantVersionsDataLayer(db),
  };
};
