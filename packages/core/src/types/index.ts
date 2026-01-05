import type {
  ValidatedLLMOpsConfig,
  LLMOpsConfigInput,
} from '../schemas/config';

export type { ValidatedLLMOpsConfig, LLMOpsConfigInput };

/**
 * LLMOpsConfig is the user-facing config type (allows optional fields)
 */
export type LLMOpsConfig = LLMOpsConfigInput;

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
};

export * from './helper';
