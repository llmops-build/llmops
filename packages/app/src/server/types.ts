import {
  type ValidatedLLMOpsConfig,
  type InlineProvidersConfig,
  type TelemetryStore,
} from '@llmops/core';
import { createDataLayer } from '@llmops/core';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    /** Inline provider configurations from code config */
    inlineProviders?: InlineProvidersConfig;
    /** Data layer for non-telemetry queries (datasets, playgrounds, etc.) - null in inline-only mode */
    db: Awaited<ReturnType<typeof createDataLayer>> | null;
    /** Raw Kysely instance - null in inline-only mode */
    kyselyDb: any | null;
    /** Database type - null in inline-only mode */
    dbType: string | null;
    /** Telemetry store for LLM request logging and traces - null in inline-only mode */
    telemetryStore: TelemetryStore | null;
  }
}

export {};
