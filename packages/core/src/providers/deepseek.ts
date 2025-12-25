import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface DeepSeekProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export class DeepSeekProvider implements BaseProvider {
  readonly name = 'deepseek';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'DeepSeek';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/deepseek.svg';
  }

  constructor(config: DeepSeekProviderConfig) {
    // DeepSeek uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com/v1',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    // DeepSeek known models
    const knownModels = ['deepseek-chat', 'deepseek-reasoner'];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'deepseek',
        name: 'DeepSeek',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // DeepSeek uses OpenAI-compatible format
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // DeepSeek returns OpenAI-compatible format
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

export const createDeepSeekProvider = (config: DeepSeekProviderConfig) => {
  return new DeepSeekProvider(config);
};
