import type { Kysely } from 'kysely';
import type { Database } from '../db';

export const createDataLayer = async (db: Kysely<Database>) => {
  return {
    db,
  };
};
