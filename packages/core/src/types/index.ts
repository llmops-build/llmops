import type {
  ValidatedLLMOpsConfig,
  LLMOpsConfigInput,
  OtlpConfig,
} from '../schemas/config';

export type { ValidatedLLMOpsConfig, LLMOpsConfigInput, OtlpConfig };

// Re-export inline provider types for convenience
export type {
  InlineProviderConfig,
  InlineProvidersConfig,
} from '../providers';

/**
 * LLMOpsConfig is the user-facing config type (allows optional fields)
 */
export type LLMOpsConfig = LLMOpsConfigInput;

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: LLMOpsConfig;
};

export * from './helper';
