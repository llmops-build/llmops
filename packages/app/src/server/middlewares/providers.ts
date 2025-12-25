import type { MiddlewareHandler } from 'hono';
import { providers } from '@llmops/core';

type ProviderInstances = Partial<
  Record<
    keyof typeof providers,
    ReturnType<(typeof providers)[keyof typeof providers]['createProvider']>
  >
>;

export const createLLMProvidersMiddleware = (): MiddlewareHandler => {
  let initialized = false;
  let providerInstances: ProviderInstances;

  return async (c, next) => {
    if (!initialized) {
      const config = c.get('llmopsConfig');
      providerInstances = Object.entries(providers).reduce(
        (acc, [key, providerFactory]) => {
          const providerKey = key as keyof typeof providers;
          const providerConfig = config.providers[providerKey];
          if (providerConfig) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            acc[providerKey] = providerFactory.createProvider(
              providerConfig as any
            );
          }
          return acc;
        },
        {} as ProviderInstances
      );
      initialized = true;
    }
    c.set('providers', providerInstances);
    await next();
  };
};
