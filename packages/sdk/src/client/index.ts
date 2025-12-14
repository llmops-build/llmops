import type { LLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';

export type LLMOpsClient = {
  getBasePath: () => string;
  handler: (request: Request) => Promise<Response>;
};

export const createLLMOps = (config: LLMOpsConfig): LLMOpsClient => {
  const { app } = createApp(config);
  return {
    getBasePath: () => config.basePath,
    handler: async (req: Request) => app.fetch(req, undefined, undefined),
  };
};
