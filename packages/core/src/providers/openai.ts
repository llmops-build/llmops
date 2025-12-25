import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import OpenAI from 'openai';

export interface OpenAIProviderConfig {
  apiKey: string;
  organization?: string;
  project?: string;
  baseURL?: string;
}

export class OpenAIProvider implements BaseProvider {
  readonly name = 'openai';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenAI;

  getName(): string {
    return 'OpenAI';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/openai.svg';
  }

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      project: config.project,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
    });
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await this.client.models.list();
    return models.data.map((model) => ({
      id: model.id,
      name: model.id,
      provider: {
        id: 'openai',
        name: 'OpenAI',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = ChatCompletionCreateParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // OpenAI native format - pass through
    return request as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatCompletion>(
    response: ResponseObj
  ): ChatCompletion {
    // OpenAI native format - pass through
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

export const createOpenAIProvider = (config: OpenAIProviderConfig) => {
  return new OpenAIProvider(config);
};
