import {
  type ValidatedLLMOpsConfig,
  type InlineProvidersConfig,
  type TelemetrySink,
} from '@llmops/core';
import type { TelemetryStore } from '@llmops/sdk';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    inlineProviders?: InlineProvidersConfig;
    telemetryStore: TelemetryStore | null;
    /** Sink the gateway + observe() emit to. Built once in createApp. */
    telemetrySink: TelemetrySink;
  }
}

export {};
