import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { createConfigDataLayer } from './configs';

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    ...createConfigDataLayer(db),
  };
};
