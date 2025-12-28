import { type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDataLayer } from '@llmops/core';

export interface LLMProvider {
  key: string;
  name: string;
  imageURI: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    llmProviders: LLMProvider[];
    db: Awaited<ReturnType<typeof createDataLayer>>;
  }
}

export {};
