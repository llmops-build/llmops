import { providers, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDataLayer } from '@llmops/core';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    providers: Partial<
      Record<
        keyof typeof providers,
        ReturnType<(typeof providers)[keyof typeof providers]['createProvider']>
      >
    >;
    db: Awaited<ReturnType<typeof createDataLayer>>;
  }
}

export {};
