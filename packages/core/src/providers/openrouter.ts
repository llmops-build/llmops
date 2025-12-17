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
import type { ValidatedLLMOpsConfig } from '../types';
import type { SupportedProviders } from './supported-providers';

export class OpenRouterProvider implements BaseProvider {
  readonly name = 'openrouter';
  readonly config = {};
  readonly chatCompletionRequestSchema = chatCompletionCreateParamsBaseSchema;
  client: OpenRouter;

  getName(): string {
    return 'OpenRouter';
  }
  getImageURI(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBjbGFzcz0ic2l6ZS00IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWxhYmVsPSJMb2dvIj48ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMjA1XzMpIj48cGF0aCBkPSJNMyAyNDguOTQ1QzE4IDI0OC45NDUgNzYgMjM2IDEwNiAyMTlDMTM2IDIwMiAxMzYgMjAyIDE5OCAxNThDMjc2LjQ5NyAxMDIuMjkzIDMzMiAxMjAuOTQ1IDQyMyAxMjAuOTQ1IiBzdHJva2Utd2lkdGg9IjkwIj48L3BhdGg+PHBhdGggZD0iTTUxMSAxMjEuNUwzNTcuMjUgMjEwLjI2OEwzNTcuMjUgMzIuNzMyNEw1MTEgMTIxLjVaIj48L3BhdGg+PHBhdGggZD0iTTAgMjQ5QzE1IDI0OSA3MyAyNjEuOTQ1IDEwMyAyNzguOTQ1QzEzMyAyOTUuOTQ1IDEzMyAyOTUuOTQ1IDE5NSAzMzkuOTQ1QzI3My40OTcgMzk1LjY1MiAzMjkgMzc3IDQyMCAzNzciIHN0cm9rZS13aWR0aD0iOTAiPjwvcGF0aD48cGF0aCBkPSJNNTA4IDM3Ni40NDVMMzU0LjI1IDI4Ny42NzhMMzU0LjI1IDQ2NS4yMTNMNTA4IDM3Ni40NDVaIj48L3BhdGg+PC9nPjx0aXRsZSBzdHlsZT0iZGlzcGxheTpub25lIj5PcGVuUm91dGVyPC90aXRsZT48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAwXzIwNV8zIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0id2hpdGUiPjwvcmVjdD48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=';
  }

  constructor(
    config: ValidatedLLMOpsConfig['providers'][SupportedProviders.OPENROUTER]
  ) {
    this.client = new OpenRouter(config);
  }

  async getModels() {
    const models = await this.client.models.list();
    return models.data.map((model) => {
      // Parse provider from model ID (format: provider/model-name)
      const [providerId] = model.id.split('/');
      const providerName =
        providerId.charAt(0).toUpperCase() + providerId.slice(1);

      return {
        id: model.id,
        name: model.name,
        provider: {
          id: providerId,
          name: providerName,
        },
        pricing: model.pricing,
      };
    });
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
  config: ValidatedLLMOpsConfig['providers'][SupportedProviders.OPENROUTER]
) => {
  return new OpenRouterProvider(config);
};
