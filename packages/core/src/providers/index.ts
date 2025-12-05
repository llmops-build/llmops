import { createOpenRouterProvider } from './openrouter';
import { SupportedProviders } from './supported-providers';

export const providers = {
  [SupportedProviders.OPENROUTER]: {
    createProvider: createOpenRouterProvider,
  },
};

export { SupportedProviders } from './supported-providers';
export * from './base-provider';
