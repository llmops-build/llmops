import { SupportedProviders } from '../providers';

export interface LLMOpsConfig {
  basePath: string;
  providers: {
    [SupportedProviders.OPENROUTER]: {
      apiKey: string;
    };
  };
}
