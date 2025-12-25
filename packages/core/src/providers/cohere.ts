import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';

export interface CohereProviderConfig {
  apiKey: string;
}

interface CohereResponse {
  generation_id?: string;
  text?: string;
  meta?: {
    tokens?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  finish_reason?: string;
}

export class CohereProvider implements BaseProvider {
  readonly name = 'cohere';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  private apiKey: string;
  private baseURL = 'https://api.cohere.ai/v1';

  getName(): string {
    return 'Cohere';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/cohere.svg';
  }

  constructor(config: CohereProviderConfig) {
    this.apiKey = config.apiKey;
  }

  async getModels(): Promise<ModelInfo[]> {
    // Cohere known models
    const knownModels = [
      'command-r-plus',
      'command-r',
      'command',
      'command-light',
      'command-nightly',
    ];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'cohere',
        name: 'Cohere',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = Record<string, unknown>>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Transform OpenAI format to Cohere format
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter(
      (m) => m.role !== 'system'
    );

    // Get the last user message
    const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];
    const chatHistory = nonSystemMessages.slice(0, -1);

    return {
      model: request.model,
      message:
        typeof lastMessage?.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content || ''),
      preamble:
        systemMessages.length > 0
          ? systemMessages.map((m) => m.content).join('\n')
          : undefined,
      chat_history: chatHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
        message:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
      })),
      temperature: request.temperature ?? undefined,
      p: request.top_p ?? undefined,
      max_tokens: request.max_tokens ?? undefined,
      stop_sequences:
        typeof request.stop === 'string'
          ? [request.stop]
          : (request.stop ?? undefined),
    } as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = CohereResponse>(
    response: ResponseObj
  ): ChatCompletion {
    // Transform Cohere response to OpenAI format
    const cohereResponse = response as CohereResponse;

    return {
      id: cohereResponse.generation_id || `cohere-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'cohere',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: cohereResponse.text || '',
          },
          finish_reason: cohereResponse.finish_reason || 'stop',
        },
      ],
      usage: cohereResponse.meta?.tokens
        ? {
            prompt_tokens: cohereResponse.meta.tokens.input_tokens || 0,
            completion_tokens: cohereResponse.meta.tokens.output_tokens || 0,
            total_tokens:
              (cohereResponse.meta.tokens.input_tokens || 0) +
              (cohereResponse.meta.tokens.output_tokens || 0),
          }
        : undefined,
    } as ChatCompletion;
  }

  async getChatCompletionResponse(
    request: ChatCompletionCreateParams
  ): Promise<ChatCompletion> {
    const body = this.transformChatCompletionRequest(request);

    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere API error: ${error}`);
    }

    const result = (await response.json()) as CohereResponse;
    return this.transformChatCompletionResponse(result);
  }
}

export const createCohereProvider = (config: CohereProviderConfig) => {
  return new CohereProvider(config);
};
