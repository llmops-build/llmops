import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface MistralProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export class MistralProvider implements BaseProvider {
  readonly name = 'mistral-ai';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'Mistral AI';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/mistral.svg';
  }

  constructor(config: MistralProviderConfig) {
    // Mistral uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.mistral.ai/v1',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await this.client.models.list();
    return models.data.map((model) => ({
      id: model.id,
      name: model.id,
      provider: {
        id: 'mistral-ai',
        name: 'Mistral AI',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Mistral uses OpenAI-compatible format
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // Mistral returns OpenAI-compatible format
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

export const createMistralProvider = (config: MistralProviderConfig) => {
  return new MistralProvider(config);
};
