import {
  type ValidatedLLMOpsConfig,
  type InlineProvidersConfig,
  type TelemetryStore,
} from '@llmops/core';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    inlineProviders?: InlineProvidersConfig;
    telemetryStore: TelemetryStore | null;
  }
}

export {};
