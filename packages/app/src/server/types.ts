import { type ValidatedLLMOpsConfig, type DataLayer } from '@llmops/core';
import type { DatabaseType } from '@llmops/core/db';
import type { Auth, BetterAuthOptions } from 'better-auth';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    db: DataLayer;
    /** Raw Kysely instance with correct schema configuration */
    kyselyDb: any;
    /** Database type (postgres, mysql, sqlite, mssql) */
    dbType: DatabaseType;
    authClient: Auth<BetterAuthOptions>;
    setupComplete: boolean;
  }
}

export {};
