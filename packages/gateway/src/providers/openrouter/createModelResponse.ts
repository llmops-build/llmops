import { ProviderConfig } from '../types';
import { createModelResponseParams } from '../open-ai-base';

// OpenRouter-specific extra parameters for the Responses API
// that extend the base OpenAI Responses API config.
const openrouterExtraParams: ProviderConfig = {
  provider: {
    param: 'provider',
    required: false,
  },
  plugins: {
    param: 'plugins',
    required: false,
  },
  top_k: {
    param: 'top_k',
    required: false,
  },
  frequency_penalty: {
    param: 'frequency_penalty',
    required: false,
  },
  presence_penalty: {
    param: 'presence_penalty',
    required: false,
  },
  session_id: {
    param: 'session_id',
    required: false,
  },
  trace: {
    param: 'trace',
    required: false,
  },
};

export const OpenrouterCreateModelResponseConfig: ProviderConfig =
  createModelResponseParams([], {}, openrouterExtraParams);
