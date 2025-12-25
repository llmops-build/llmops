import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface FireworksProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export class FireworksProvider implements BaseProvider {
  readonly name = 'fireworks-ai';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'Fireworks AI';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/fireworks.svg';
  }

  constructor(config: FireworksProviderConfig) {
    // Fireworks AI uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.fireworks.ai/inference/v1',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await this.client.models.list();
    return models.data.map((model) => ({
      id: model.id,
      name: model.id,
      provider: {
        id: 'fireworks-ai',
        name: 'Fireworks AI',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Fireworks AI uses OpenAI-compatible format
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // Fireworks AI returns OpenAI-compatible format
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

export const createFireworksProvider = (config: FireworksProviderConfig) => {
  return new FireworksProvider(config);
};
