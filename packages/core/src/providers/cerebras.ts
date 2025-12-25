import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface CerebrasProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export class CerebrasProvider implements BaseProvider {
  readonly name = 'cerebras';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'Cerebras';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/cerebras.svg';
  }

  constructor(config: CerebrasProviderConfig) {
    // Cerebras uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.cerebras.ai/v1',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    // Cerebras known models
    const knownModels = ['llama3.1-8b', 'llama3.1-70b', 'llama-3.3-70b'];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'cerebras',
        name: 'Cerebras',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Cerebras uses OpenAI-compatible format
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // Cerebras returns OpenAI-compatible format
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

export const createCerebrasProvider = (config: CerebrasProviderConfig) => {
  return new CerebrasProvider(config);
};
