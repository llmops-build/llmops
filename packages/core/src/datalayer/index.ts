import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { createConfigDataLayer } from './configs';
import { createConfigVariantDataLayer } from './configVariants';
import { createVariantDataLayer } from './variants';

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    ...createConfigDataLayer(db),
    ...createConfigVariantDataLayer(db),
    ...createVariantDataLayer(db),
  };
};
