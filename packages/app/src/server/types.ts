import {
  type ValidatedLLMOpsConfig,
  type InlineProvidersConfig,
} from '@llmops/core';
import { createDataLayer } from '@llmops/core';
import type { DatabaseType } from '@llmops/core/db';
import type { Auth, BetterAuthOptions } from 'better-auth';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    /** Inline provider configurations from code config */
    inlineProviders?: InlineProvidersConfig;
    /** Data layer - null when running in inline-only mode (no database) */
    db: Awaited<ReturnType<typeof createDataLayer>> | null;
    /** Raw Kysely instance with correct schema configuration - null in inline-only mode */
    kyselyDb: any | null;
    /** Database type (postgres, mysql, sqlite, mssql) - null in inline-only mode */
    dbType: DatabaseType | null;
    /** Auth client - null in inline-only mode */
    authClient: Auth<BetterAuthOptions> | null;
    setupComplete: boolean;
  }
}

export {};
