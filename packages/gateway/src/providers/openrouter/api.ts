import { POWERED_BY } from '../../globals';
import { ProviderAPIConfig } from '../types';

const OpenrouterAPIConfig: ProviderAPIConfig = {
  getBaseURL: () => 'https://openrouter.ai/api',
  headers: ({ providerOptions }) => {
    return {
      Authorization: `Bearer ${providerOptions.apiKey}`, // https://openrouter.ai/keys
      'HTTP-Referer': 'https://llmops.build/',
      'X-Title': POWERED_BY,
    };
  },
  getEndpoint: ({ fn, gatewayRequestURL }) => {
    switch (fn) {
      case 'chatComplete':
        return '/v1/chat/completions';
      case 'createModelResponse':
        return '/v1/responses';
      case 'getModelResponse':
      case 'deleteModelResponse':
      case 'listResponseInputItems': {
        const basePath = gatewayRequestURL.split('/v1')?.[1];
        return basePath;
      }
      default:
        return '';
    }
  },
};

export default OpenrouterAPIConfig;
