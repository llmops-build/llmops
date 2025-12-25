import type { BaseProvider, ModelInfo } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';

export interface GoogleProviderConfig {
  apiKey: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
      role?: string;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  model?: string;
}

export class GoogleProvider implements BaseProvider {
  readonly name = 'google';
  readonly config: Record<string, unknown> = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  private apiKey: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  private lastRequestedModel: string = '';

  getName(): string {
    return 'Google Gemini';
  }
  getImageURI(): string {
    return 'https://models.dev/logos/google.svg';
  }

  constructor(config: GoogleProviderConfig) {
    this.apiKey = config.apiKey;
  }

  async getModels(): Promise<ModelInfo[]> {
    // Google Gemini known models
    const knownModels = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro',
    ];

    return knownModels.map((modelId) => ({
      id: modelId,
      name: modelId,
      provider: {
        id: 'google',
        name: 'Google Gemini',
      },
    }));
  }

  transformChatCompletionRequest<ReturnType = Record<string, unknown>>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Transform OpenAI format to Google Gemini format
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter(
      (m) => m.role !== 'system'
    );

    const contents = nonSystemMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        },
      ],
    }));

    // Store the model for use in response transformation
    this.lastRequestedModel = request.model;

    return {
      model: request.model,
      systemInstruction:
        systemMessages.length > 0
          ? {
              parts: [
                { text: systemMessages.map((m) => m.content).join('\n') },
              ],
            }
          : undefined,
      contents,
      generationConfig: {
        temperature: request.temperature ?? undefined,
        topP: request.top_p ?? undefined,
        maxOutputTokens: request.max_tokens ?? undefined,
        stopSequences:
          typeof request.stop === 'string'
            ? [request.stop]
            : (request.stop ?? undefined),
      },
    } as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = GeminiResponse>(
    response: ResponseObj
  ): ChatCompletion {
    // Transform Google Gemini response to OpenAI format
    const geminiResponse = response as GeminiResponse;
    const firstCandidate = geminiResponse.candidates?.[0];
    const textContent = firstCandidate?.content?.parts?.[0]?.text || '';

    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: geminiResponse.model || this.lastRequestedModel || 'gemini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: textContent,
          },
          finish_reason:
            firstCandidate?.finishReason === 'STOP' ? 'stop' : 'stop',
        },
      ],
      usage: geminiResponse.usageMetadata
        ? {
            prompt_tokens: geminiResponse.usageMetadata.promptTokenCount || 0,
            completion_tokens:
              geminiResponse.usageMetadata.candidatesTokenCount || 0,
            total_tokens: geminiResponse.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    } as ChatCompletion;
  }

  async getChatCompletionResponse(
    request: ChatCompletionCreateParams
  ): Promise<ChatCompletion> {
    const transformedRequest = this.transformChatCompletionRequest(request);
    const reqData = transformedRequest as {
      model: string;
      systemInstruction?: { parts: { text: string }[] };
      contents: { role: string; parts: { text: string }[] }[];
      generationConfig: Record<string, unknown>;
    };

    const response = await fetch(
      `${this.baseURL}/models/${reqData.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: reqData.contents,
          systemInstruction: reqData.systemInstruction,
          generationConfig: reqData.generationConfig,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Gemini API error: ${error}`);
    }

    const result = (await response.json()) as GeminiResponse;
    return this.transformChatCompletionResponse(result);
  }
}

export const createGoogleProvider = (config: GoogleProviderConfig) => {
  return new GoogleProvider(config);
};
