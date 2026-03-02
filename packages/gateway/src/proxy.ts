import type { Result } from 'neverthrow';
import type { ProviderConfig } from './types/provider';
import { RequestType } from './types/requests';
import { type GatewayError, notFound, errorResponse } from './utils/responses';
import { handleChatCompletions } from './handlers/chatCompletions';
import { handleCompletions } from './handlers/completions';
import { handleResponses } from './handlers/responses';
import { handleEmbeddings } from './handlers/embeddings';
import { handleImageGenerations } from './handlers/imageGenerations';
import { handleImageEdits } from './handlers/imageEdits';
import { handleImageVariations } from './handlers/imageVariations';
import { handleModerations } from './handlers/moderations';
import { handleAudioTranscriptions } from './handlers/audioTranscriptions';
import { handleAudioTranslations } from './handlers/audioTranslations';
import { handleAudioSpeech } from './handlers/audioSpeech';

function resolveRequestType(path: string): RequestType | null {
  for (const value of Object.values(RequestType)) {
    if (path.endsWith(value)) {
      return value;
    }
  }
  return null;
}

async function route(
  requestType: RequestType | null,
  config: ProviderConfig,
  request: Request,
  path: string
): Promise<Result<Response, GatewayError>> {
  switch (requestType) {
    case RequestType.ChatCompletion:
      return handleChatCompletions(config, request);
    case RequestType.Completion:
      return handleCompletions(config, request);
    case RequestType.Responses:
      return handleResponses(config, request);
    case RequestType.Embedding:
      return handleEmbeddings(config, request);
    case RequestType.ImageGeneration:
      return handleImageGenerations(config, request);
    case RequestType.ImageEdit:
      return handleImageEdits(config, request);
    case RequestType.ImageVariation:
      return handleImageVariations(config, request);
    case RequestType.Moderation:
      return handleModerations(config, request);
    case RequestType.AudioTranscription:
      return handleAudioTranscriptions(config, request);
    case RequestType.AudioTranslation:
      return handleAudioTranslations(config, request);
    case RequestType.AudioSpeech:
      return handleAudioSpeech(config, request);
    default:
      return notFound(`Unsupported endpoint: ${path}`);
  }
}

export async function proxyRequest(
  config: ProviderConfig,
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const requestType = resolveRequestType(url.pathname);

  const result = await route(requestType, config, request, url.pathname);
  return result.match(
    (response) => response,
    (error) => errorResponse(error)
  );
}
