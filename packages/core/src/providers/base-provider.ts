import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import type z from 'zod';

export interface ModelProviderInfo {
  id: string;
  name: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider?: ModelProviderInfo;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
}

export interface BaseProvider {
  /**
   * Provider name/identifier
   */
  readonly name: string;
  readonly config: Record<string, unknown>;

  getName(): string;
  getImageURI(): string;

  chatCompletionRequestSchema: z.ZodObject<any>;

  /**
   * Get available models from the provider
   */
  getModels(): Promise<ModelInfo[]>;

  /**
   * Transform request from openai format to provider specific format
   */
  transformChatCompletionRequest<ReturnType = Record<string, unknown>>(
    request: ChatCompletionCreateParams
  ): ReturnType;

  /**
   * Transform response from provider specific format to openai format
   */
  transformChatCompletionResponse<ResponseObj = Record<string, unknown>>(
    response: ResponseObj
  ): ChatCompletion;
}
