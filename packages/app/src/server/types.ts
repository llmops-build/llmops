import { providers, type LLMOpsConfig } from '@llmops/core';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: LLMOpsConfig;
    providers: Record<
      keyof typeof providers,
      ReturnType<(typeof providers)[keyof typeof providers]['createProvider']>
    >;
  }
}

export {};
