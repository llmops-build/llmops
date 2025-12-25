import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';

export interface AnthropicProviderConfig {
  apiKey: string;
  baseURL?: string;
}

interface AnthropicMessage {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider implements BaseProvider {
  readonly name = 'anthropic';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  private apiKey: string;
  private baseURL: string;

  getName(): string {
    return 'Anthropic';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/anthropic.svg';
  }

  constructor(config: AnthropicProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.anthropic.com';
  }

  async getModels(): Promise<ModelInfo[]> {
    // Anthropic doesn't have a models list endpoint, return known models
    const knownModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'anthropic',
        name: 'Anthropic',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = Record<string, unknown>>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Transform OpenAI format to Anthropic format
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter(
      (m) => m.role !== 'system'
    );

    return {
      model: request.model,
      max_tokens: request.max_tokens || 4096,
      system:
        systemMessages.length > 0
          ? systemMessages.map((m) => m.content).join('\n')
          : undefined,
      messages: nonSystemMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
      })),
      temperature: request.temperature ?? undefined,
      top_p: request.top_p ?? undefined,
      stop_sequences:
        typeof request.stop === 'string'
          ? [request.stop]
          : (request.stop ?? undefined),
    } as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = AnthropicMessage>(
    response: ResponseObj
  ): ChatCompletion {
    // Transform Anthropic response to OpenAI format
    const anthropicResponse = response as AnthropicMessage;
    const textContent = anthropicResponse.content.find(
      (block: { type: string; text?: string }) => block.type === 'text'
    );

    return {
      id: anthropicResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: anthropicResponse.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: textContent?.text || '',
          },
          finish_reason:
            anthropicResponse.stop_reason === 'end_turn' ? 'stop' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: anthropicResponse.usage.input_tokens,
        completion_tokens: anthropicResponse.usage.output_tokens,
        total_tokens:
          anthropicResponse.usage.input_tokens +
          anthropicResponse.usage.output_tokens,
      },
    } as ChatCompletion;
  }

  async getChatCompletionResponse(
    request: ChatCompletionCreateParams
  ): Promise<ChatCompletion> {
    const body = this.transformChatCompletionRequest(request);

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const result = (await response.json()) as AnthropicMessage;
    return this.transformChatCompletionResponse(result);
  }
}

export const createAnthropicProvider = (config: AnthropicProviderConfig) => {
  return new AnthropicProvider(config);
};
