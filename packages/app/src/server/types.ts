import { providers, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createDataLayer } from '@llmops/core';
import type { AuthContext } from './middlewares/auth';
import type { ParsedEnvVariables } from './lib/env';

declare module 'hono' {
  interface ContextVariableMap {
    llmopsConfig: ValidatedLLMOpsConfig;
    providers: Record<
      keyof typeof providers,
      ReturnType<(typeof providers)[keyof typeof providers]['createProvider']>
    >;
    db: Awaited<ReturnType<typeof createDataLayer>>;
    auth: AuthContext | undefined;
    env: ParsedEnvVariables;
  }
}

export {};
