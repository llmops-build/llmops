import type { ProviderConfig } from '../types/provider';
import { RequestType } from '../types/requests';
import type { EndpointConfig, ProviderAdapter } from './types';
import { extractForwardHeaders } from './utils';

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function resolveBaseURL(config: ProviderConfig): string {
  const base = config.baseURL ?? config.azureFoundryUrl ?? '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function deploymentPrefix(config: ProviderConfig): string {
  const name = config.azureDeploymentId ?? config.azureDeploymentName;
  return name ? `/deployments/${name}` : '';
}

function appendApiVersion(url: string, config: ProviderConfig): string {
  if (!config.azureApiVersion) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}api-version=${config.azureApiVersion}`;
}

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------

function getHeaders(
  config: ProviderConfig,
  request: Request
): Record<string, string> {
  const headers: Record<string, string> = {
    ...extractForwardHeaders(config, request),
    'extra-parameters': config.azureExtraParameters ?? 'drop',
  };

  const deployment = config.azureDeploymentId ?? config.azureDeploymentName;
  if (deployment) {
    headers['azureml-model-deployment'] = deployment;
  }

  // Auth: AD token takes precedence, then apiKey
  if (config.azureAdToken) {
    headers['Authorization'] =
      `Bearer ${config.azureAdToken.replace('Bearer ', '')}`;
  } else if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Request transforms
// ---------------------------------------------------------------------------

/** Map OpenAI `developer` role to `system` (Azure AI Inference convention). */
function transformChatRequestBody(
  body: unknown,
  _config: ProviderConfig
): unknown {
  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.messages)) return body;
  return {
    ...obj,
    messages: (obj.messages as Record<string, unknown>[]).map((msg) =>
      msg.role === 'developer' ? { ...msg, role: 'system' } : msg
    ),
  };
}

// ---------------------------------------------------------------------------
// Endpoint factories
// ---------------------------------------------------------------------------

/**
 * Endpoints that include `/deployments/{name}` in the URL path.
 * Used for: chat completions, completions, embeddings.
 */
function makeDeploymentEndpoint(
  path: string,
  transform?: EndpointConfig['transformRequestBody']
): EndpointConfig {
  return {
    getURL(config) {
      const url = `${resolveBaseURL(config)}${deploymentPrefix(config)}${path}`;
      return appendApiVersion(url, config);
    },
    getHeaders,
    ...(transform && { transformRequestBody: transform }),
  };
}

/**
 * Endpoints that sit directly under the base URL (no deployment prefix).
 * Used for: images, audio, responses.
 */
function makeDirectEndpoint(path: string): EndpointConfig {
  return {
    getURL(config) {
      const url = `${resolveBaseURL(config)}${path}`;
      return appendApiVersion(url, config);
    },
    getHeaders,
  };
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export const azureAi: ProviderAdapter = {
  name: 'Azure AI Inference',
  endpoints: {
    [RequestType.ChatCompletion]: makeDeploymentEndpoint(
      '/chat/completions',
      transformChatRequestBody
    ),
    [RequestType.Completion]: makeDeploymentEndpoint('/completions'),
    [RequestType.Embedding]: makeDeploymentEndpoint('/embeddings'),
    [RequestType.Responses]: makeDirectEndpoint('/responses'),
    [RequestType.ImageGeneration]: makeDirectEndpoint('/images/generations'),
    [RequestType.ImageEdit]: makeDirectEndpoint('/images/edits'),
    [RequestType.AudioSpeech]: makeDirectEndpoint('/audio/speech'),
    [RequestType.AudioTranscription]: makeDirectEndpoint(
      '/audio/transcriptions'
    ),
    [RequestType.AudioTranslation]: makeDirectEndpoint('/audio/translations'),
  },
};
