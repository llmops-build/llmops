import { SupportedProviders } from '../providers';

export interface LLMOpsConfig {
  basePath: string;
  providers: {
    [SupportedProviders.OPENROUTER]?: {
      apiKey: string;
    };
  };
}

// Re-export the validated config type
export type { ValidatedLLMOpsConfig } from '../schemas/config';
