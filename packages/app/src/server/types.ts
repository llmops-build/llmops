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
    /**
     * Set to true by enterprise auth middleware to skip basic auth.
     * Enterprise packages should set this after successful authentication.
     */
    authHandled: boolean;
  }
}

export {};
