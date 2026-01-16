import type { BetterAuthOptions } from 'better-auth';
import type { Kysely } from 'kysely';
import type { Database } from '../db';

export interface AuthClientDatabaseConfig {
  /** Pre-configured Kysely instance with correct schema */
  db: Kysely<Database>;
  /** Database type (mapped to Better Auth compatible types) */
  type: 'postgres' | 'mysql' | 'sqlite' | 'mssql';
}

export interface AuthClientOptions {
  /** Database configuration */
  database: any | AuthClientDatabaseConfig;
  /**
   * Callback fired after a user is created (signs up) successfully.
   * Use this to set up workspace settings like superAdminId.
   */
  onUserCreated?: (userId: string) => Promise<void>;
  /**
   * Base URL for the application (used for auth redirects and origin validation)
   */
  baseURL?: string;
  /**
   * Additional trusted origins for CORS (e.g., production domains).
   * Set via AUTH_TRUSTED_ORIGINS environment variable (comma-separated).
   */
  trustedOrigins?: string[];
}

/**
 * Get Better Auth client options
 *
 * @param options - Auth client options including database config and hooks
 */
export const getAuthClientOptions = (
  options: AuthClientOptions
): BetterAuthOptions => {
  const { database, onUserCreated, baseURL, trustedOrigins } = options;

  return {
    database,
    baseURL,
    trustedOrigins,
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
