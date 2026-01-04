import { type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDataLayer } from '@llmops/core';
import type { Auth, BetterAuthOptions } from 'better-auth';

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
    authClient: Auth<BetterAuthOptions>;
    setupComplete: boolean;
  }
}

export {};
