import type { BetterAuthOptions } from 'better-auth';
import type { Kysely } from 'kysely';
import type { Database, DatabaseType } from '../db';

export interface AuthClientDatabaseConfig {
  /** Pre-configured Kysely instance with correct schema */
  db: Kysely<Database>;
  /** Database type */
  type: DatabaseType;
}

export interface AuthClientOptions {
  /** Database configuration */
  database: any | AuthClientDatabaseConfig;
  /**
   * Callback fired after a user is created (signs up) successfully.
   * Use this to set up workspace settings like superAdminId.
   */
  onUserCreated?: (userId: string) => Promise<void>;
}

/**
 * Get Better Auth client options
 *
 * @param options - Auth client options including database config and hooks
 */
export const getAuthClientOptions = (
  options: AuthClientOptions
): BetterAuthOptions => {
  const { database, onUserCreated } = options;

  return {
    database,
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: onUserCreated
      ? {
          user: {
            create: {
              after: async (user) => {
                await onUserCreated(user.id);
              },
            },
          },
        }
      : undefined,
  };
};
