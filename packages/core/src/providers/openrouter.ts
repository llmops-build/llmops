import type { BaseProvider } from './base-provider';
import type {
  ChatCompletionCreateParams,
  ChatCompletion,
} from 'openai/resources/chat/completions';
import type {
  ChatGenerationParams,
  ChatResponse,
} from '@openrouter/sdk/models';
import { chatCompletionCreateParamsBaseSchema } from '../schemas/openai';
import { OpenRouter } from '@openrouter/sdk';
import type { LLMOpsConfig } from '../types';
import type { SupportedProviders } from './supported-providers';

export class OpenRouterProvider implements BaseProvider {
  readonly name = 'openrouter';
  readonly config = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenRouter;

  constructor(
    config: LLMOpsConfig['providers'][SupportedProviders.OPENROUTER]
  ) {
    this.client = new OpenRouter(config);
  }

  transformChatCompletionRequest<ReturnType = ChatGenerationParams>(
    request: ChatCompletionCreateParams
  ): ReturnType {
    // Transform OpenAI format to OpenRouter format
    return {
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.max_tokens,
      topP: request.top_p,
      frequencyPenalty: request.frequency_penalty,
      presencePenalty: request.presence_penalty,
      stop: request.stop,
      stream: request.stream,
      tools: request.tools,
      toolChoice: request.tool_choice,
    } as ReturnType;
  }

  transformChatCompletionResponse<ResponseObj = ChatResponse>(
    response: ResponseObj
  ): ChatCompletion {
    // Transform OpenRouter response to OpenAI format
    const openRouterResponse = response as ChatResponse;
    return {
      id: openRouterResponse.id,
      object: openRouterResponse.object,
      created: openRouterResponse.created,
      model: openRouterResponse.model,
      choices: openRouterResponse.choices.map((choice) => ({
        index: choice.index,
        message: choice.message,
        finish_reason: choice.finishReason,
      })),
      usage: openRouterResponse.usage
        ? {
            prompt_tokens: openRouterResponse.usage.promptTokens,
            completion_tokens: openRouterResponse.usage.completionTokens,
            total_tokens: openRouterResponse.usage.totalTokens,
          }
        : undefined,
      system_fingerprint: openRouterResponse.systemFingerprint,
    } as ChatCompletion;
  }

  async getChatCompletionResponse(request: ChatCompletionCreateParams) {
    const body = this.transformChatCompletionRequest(request);
    const response = await this.client.chat.send(body);
    return this.transformChatCompletionResponse(response);
  }
}

export const createOpenRouterProvider = (
  config: LLMOpsConfig['providers'][SupportedProviders.OPENROUTER]
) => {
  return new OpenRouterProvider(config);
};
