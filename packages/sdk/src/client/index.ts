import { type LLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
};

export const createLLMOps = (config: LLMOpsConfig): LLMOpsClient => {
  const { app } = createApp(config);
  return {
    handler: async (req: Request) => app.fetch(req, undefined, undefined),
    config: Object.freeze(config),
  };
};
