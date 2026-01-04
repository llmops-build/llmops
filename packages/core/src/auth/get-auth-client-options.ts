import type { BetterAuthOptions } from 'better-auth';

export const getAuthClientOptions = (database: any): BetterAuthOptions => {
  return {
    database,
  };
};
