import type { LLMOpsConfig } from '@/types';
import { createOpenRouterProvider } from './openrouter';
import { SupportedProviders } from './supported-providers';

export const providers = {
  [SupportedProviders.OPENROUTER]: {
    createProvider: createOpenRouterProvider,
  },
};

export const createProviders = (
  initiatedProviders: LLMOpsConfig['providers']
) => {
  const providerInstances = [];
  for (const key of Object.keys(initiatedProviders)) {
    const providerConfig = initiatedProviders[key as SupportedProviders];
    const providerFactory = providers[key as SupportedProviders];
    if (!providerFactory) {
      throw new Error(`Provider ${key} is not supported.`);
    }
    const providerInstance = providerFactory.createProvider(providerConfig);

    providerInstances.push({
      key,
      instance: providerInstance,
    });
  }

  return providerInstances;
};

export { SupportedProviders } from './supported-providers';
export * from './base-provider';
