import {
  type ValidatedLLMOpsConfig,
  type InlineProvidersConfig,
} from '@llmops/core';
import type { TelemetryStore } from '@llmops/sdk';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    inlineProviders?: InlineProvidersConfig;
    telemetryStore: TelemetryStore | null;
  }
}

export {};
