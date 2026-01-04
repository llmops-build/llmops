import type { BetterAuthOptions } from 'better-auth';
import type { Kysely } from 'kysely';
import type { Database, DatabaseType } from '../db';

export interface AuthClientDatabaseConfig {
  /** Pre-configured Kysely instance with correct schema */
  db: Kysely<Database>;
  /** Database type */
  type: DatabaseType;
}

/**
 * Get Better Auth client options
 *
 * @param database - Either a raw database connection or a pre-configured Kysely instance
 *                   When using PostgreSQL with custom schema, pass { db, type } to ensure
 *                   Better Auth uses the correctly configured Kysely instance
 */
export const getAuthClientOptions = (
  database: any | AuthClientDatabaseConfig
): BetterAuthOptions => {
  return {
    database,
    emailAndPassword: {
      enabled: true,
    },
  };
};
