import type { LLMOpsConfig } from '@/types';
import { createOpenRouterProvider } from './openrouter';
import { createOpenAIProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGroqProvider } from './groq';
import { createGoogleProvider } from './google';
import { createMistralProvider } from './mistral';
import { createTogetherProvider } from './together';
import { createFireworksProvider } from './fireworks';
import { createDeepSeekProvider } from './deepseek';
import { createCohereProvider } from './cohere';
import { createCerebrasProvider } from './cerebras';
import { createPerplexityProvider } from './perplexity';
import { SupportedProviders } from './supported-providers';

export const providers = {
  [SupportedProviders.OPENROUTER]: {
    createProvider: createOpenRouterProvider,
  },
  [SupportedProviders.OPENAI]: {
    createProvider: createOpenAIProvider,
  },
  [SupportedProviders.ANTHROPIC]: {
    createProvider: createAnthropicProvider,
  },
  [SupportedProviders.GROQ]: {
    createProvider: createGroqProvider,
  },
  [SupportedProviders.GOOGLE]: {
    createProvider: createGoogleProvider,
  },
  [SupportedProviders.MISTRAL_AI]: {
    createProvider: createMistralProvider,
  },
  [SupportedProviders.TOGETHER_AI]: {
    createProvider: createTogetherProvider,
  },
  [SupportedProviders.FIREWORKS_AI]: {
    createProvider: createFireworksProvider,
  },
  [SupportedProviders.DEEPSEEK]: {
    createProvider: createDeepSeekProvider,
  },
  [SupportedProviders.COHERE]: {
    createProvider: createCohereProvider,
  },
  [SupportedProviders.CEREBRAS]: {
    createProvider: createCerebrasProvider,
  },
  [SupportedProviders.PERPLEXITY_AI]: {
    createProvider: createPerplexityProvider,
  },
};

export const createProviders = (
  initiatedProviders: LLMOpsConfig['providers']
) => {
  const providerInstances = [];
  for (const key of Object.keys(initiatedProviders)) {
    const providerConfig =
      initiatedProviders[key as keyof typeof initiatedProviders];
    const providerFactory = providers[key as keyof typeof providers];
    if (!providerFactory) {
      throw new Error(`Provider ${key} is not supported.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providerInstance = providerFactory.createProvider(
      providerConfig as any
    );

    providerInstances.push({
      key,
      instance: providerInstance,
    });
  }

  return providerInstances;
};

export { SupportedProviders } from './supported-providers';
export * from './base-provider';

// Export all provider classes and config types
export { OpenRouterProvider } from './openrouter';
export { OpenAIProvider, type OpenAIProviderConfig } from './openai';
export { AnthropicProvider, type AnthropicProviderConfig } from './anthropic';
export { GroqProvider, type GroqProviderConfig } from './groq';
export { GoogleProvider, type GoogleProviderConfig } from './google';
export { MistralProvider, type MistralProviderConfig } from './mistral';
export { TogetherProvider, type TogetherProviderConfig } from './together';
export { FireworksProvider, type FireworksProviderConfig } from './fireworks';
export { DeepSeekProvider, type DeepSeekProviderConfig } from './deepseek';
export { CohereProvider, type CohereProviderConfig } from './cohere';
export { CerebrasProvider, type CerebrasProviderConfig } from './cerebras';
export {
  PerplexityProvider,
  type PerplexityProviderConfig,
} from './perplexity';
