import type { ProviderConfig } from '../types/provider';
import { RequestType } from '../types/requests';
import type { EndpointConfig, ProviderAdapter } from './types';
import { bearerAuthHeader, defaultURL, extractForwardHeaders } from './utils';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

function resolveBaseURL(config: ProviderConfig): string {
  return config.baseURL ?? config.customHost ?? DEFAULT_BASE_URL;
}

function getURL(config: ProviderConfig, requestType: RequestType): string {
  return defaultURL(resolveBaseURL(config), requestType);
}

function getHeaders(
  config: ProviderConfig,
  request: Request
): Record<string, string> {
  const headers: Record<string, string> = {
    ...bearerAuthHeader(config.apiKey),
    ...extractForwardHeaders(config, request),
  };

  if (config.openaiOrganization) {
    headers['OpenAI-Organization'] = config.openaiOrganization;
  }
  if (config.openaiProject) {
    headers['OpenAI-Project'] = config.openaiProject;
  }
  if (config.openaiBeta) {
    headers['OpenAI-Beta'] = config.openaiBeta;
  }

  return headers;
}

function makeEndpoint(): EndpointConfig {
  return { getURL, getHeaders };
}

export const openai: ProviderAdapter = {
  name: 'openai',
  endpoints: {
    [RequestType.ChatCompletion]: makeEndpoint(),
    [RequestType.Completion]: makeEndpoint(),
    [RequestType.Responses]: makeEndpoint(),
    [RequestType.Embedding]: makeEndpoint(),
    [RequestType.ImageGeneration]: makeEndpoint(),
    [RequestType.ImageEdit]: makeEndpoint(),
    [RequestType.ImageVariation]: makeEndpoint(),
    [RequestType.Moderation]: makeEndpoint(),
    [RequestType.AudioTranscription]: makeEndpoint(),
    [RequestType.AudioTranslation]: makeEndpoint(),
    [RequestType.AudioSpeech]: makeEndpoint(),
  },
};
