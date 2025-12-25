import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface PerplexityProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export class PerplexityProvider implements BaseProvider {
  readonly name = 'perplexity-ai';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'Perplexity AI';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/perplexity.svg';
  }

  constructor(config: PerplexityProviderConfig) {
    // Perplexity uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.perplexity.ai',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    // Perplexity known models
    const knownModels = [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
      'llama-3.1-sonar-small-128k-chat',
      'llama-3.1-sonar-large-128k-chat',
    ];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'perplexity-ai',
        name: 'Perplexity AI',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Perplexity uses OpenAI-compatible format
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // Perplexity returns OpenAI-compatible format
    return response as ChatCompletion;
  }

  async getChatCompletionResponse(
    request: ChatCompletionCreateParams
  ): Promise<ChatCompletion> {
    const body = this.transformChatCompletionRequest(request);
    const response = await this.client.chat.completions.create(body);
    return this.transformChatCompletionResponse(response);
  }
}

export const createPerplexityProvider = (config: PerplexityProviderConfig) => {
  return new PerplexityProvider(config);
};
