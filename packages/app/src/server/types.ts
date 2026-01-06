import { type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDataLayer } from '@llmops/core';
import type { DatabaseType } from '@llmops/core/db';
import type { Auth, BetterAuthOptions } from 'better-auth';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    db: Awaited<ReturnType<typeof createDataLayer>>;
    /** Raw Kysely instance with correct schema configuration */
    kyselyDb: any;
    /** Database type (postgres, mysql, sqlite, mssql) */
    dbType: DatabaseType;
    authClient: Auth<BetterAuthOptions>;
    setupComplete: boolean;
  }
}

export {};
