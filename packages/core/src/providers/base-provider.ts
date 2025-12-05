import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import type z from 'zod';

export interface BaseProvider {
  /**
   * Provider name/identifier
   */
  readonly name: string;
  readonly config: Record<string, unknown>;

  chatCompletionRequestSchema: z.ZodObject<any>;
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
