import type { ValidatedLLMOpsConfig } from '../schemas/config';

export type { ValidatedLLMOpsConfig };

export type LLMOpsConfig = ValidatedLLMOpsConfig;

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
};

export * from './helper';
